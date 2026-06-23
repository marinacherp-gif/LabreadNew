import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/orders/[id] — full order detail
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      orderItems: {
        include: { product: true },
      },
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

const PatchSchema = z.object({
  status: z.enum(["OPEN", "PAUSED", "DONE", "CANCELED"]).optional(),
  paymentStatus: z.enum(["PAID", "NOT_PAID"]).optional(),
});

// PATCH /api/orders/[id] — update status or payment status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // When canceling, restore stock — but only if not already canceled (avoid double-restore)
  if (parsed.data.status === "CANCELED") {
    const current = await prisma.order.findUnique({
      where: { id: params.id },
      select: {
        status: true,
        orderItems: { select: { productId: true, quantity: true } },
      },
    });

    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (current.status !== "CANCELED") {
      const [order] = await prisma.$transaction([
        prisma.order.update({ where: { id: params.id }, data: parsed.data }),
        ...current.orderItems.map(item =>
          prisma.product.update({
            where: { id: item.productId },
            data: { stockAmount: { increment: item.quantity } },
          })
        ),
      ]);
      return NextResponse.json(order);
    }
  }

  const order = await prisma.order.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json(order);
}

// DELETE /api/orders/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.order.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
