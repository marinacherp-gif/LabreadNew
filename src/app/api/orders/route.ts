import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeClientRating } from "@/lib/utils";
import { buildOrderMessage, sendOwnerWhatsApp } from "@/lib/whatsapp";
import type { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";

// GET /api/orders — admin list with filters
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const statusParam = searchParams.get("statuses");
  const paymentParam = searchParams.get("paymentStatuses");
  const search = searchParams.get("search") ?? "";
  const phone = searchParams.get("phone") ?? "";

  const statuses = statusParam
    ? (statusParam.split(",").filter(Boolean) as OrderStatus[])
    : (["OPEN", "PAUSED"] as OrderStatus[]);

  const paymentStatuses = paymentParam
    ? (paymentParam.split(",").filter(Boolean) as PaymentStatus[])
    : [];

  const where: Prisma.OrderWhereInput = {
    ...(from || to
      ? {
          deliveryDate: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to + "T23:59:59.999Z") }),
          },
        }
      : {}),
    ...(statuses.length > 0 && { status: { in: statuses } }),
    ...(paymentStatuses.length > 0 && { paymentStatus: { in: paymentStatuses } }),
    ...(search && { clientName: { contains: search, mode: "insensitive" } }),
    ...(phone && { clientPhone: { contains: phone } }),
  };

  const orders = await prisma.order.findMany({
    where,
    include: {
      orderItems: { include: { product: { select: { id: true, name: true, pictureUrl: true } } } },
    },
    orderBy: { deliveryDate: "asc" },
  });

  return NextResponse.json(orders);
}

// POST /api/orders — public shop checkout
const CheckoutSchema = z.object({
  clientName: z.string().min(1),
  clientPhone: z.string().min(5),
  deliveryDate: z.string().min(1),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { clientName, clientPhone, deliveryDate, items } = parsed.data;

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, isActive: true },
  });

  if (products.length !== items.length) {
    return NextResponse.json({ error: "Some products are unavailable" }, { status: 400 });
  }

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));
  let totalPrice = 0;
  for (const item of items) {
    totalPrice += Number(productMap[item.productId].price) * item.quantity;
  }

  const previousOrderCount = await prisma.order.count({
    where: { clientPhone },
  });
  const clientRating = computeClientRating(previousOrderCount);

  const order = await prisma.order.create({
    data: {
      clientName,
      clientPhone,
      clientRating,
      deliveryDate: new Date(deliveryDate),
      totalPrice,
      orderItems: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: productMap[item.productId].price,
        })),
      },
    },
    include: { orderItems: true },
  });

  // Fire-and-forget: failure must not affect the order response
  const waMessage = buildOrderMessage({
    clientName,
    clientPhone,
    deliveryDate: new Date(deliveryDate),
    items: order.orderItems.map((oi) => ({
      name:            productMap[oi.productId].name,
      quantity:        oi.quantity,
      priceAtPurchase: Number(oi.priceAtPurchase),
    })),
    totalPrice,
  });
  sendOwnerWhatsApp(waMessage).catch(() => {});

  return NextResponse.json(order, { status: 201 });
}
