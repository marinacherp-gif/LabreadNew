import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildOrdersCsvRows, todayISO } from "@/lib/utils";
import type { OrderStatus, Prisma } from "@prisma/client";

// GET /api/orders/export — CSV download
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids");
  const ids = idsParam ? idsParam.split(",").filter(Boolean) : null;

  let where: Prisma.OrderWhereInput = {};

  if (ids && ids.length > 0) {
    where = { id: { in: ids } };
  } else {
    const from = searchParams.get("from") ?? todayISO();
    const to = searchParams.get("to") ?? todayISO();
    const statusParam = searchParams.get("statuses");
    const search = searchParams.get("search") ?? "";
    const phone = searchParams.get("phone") ?? "";

    const statuses = statusParam
      ? (statusParam.split(",").filter(Boolean) as OrderStatus[])
      : [];

    where = {
      deliveryDate: {
        gte: new Date(from),
        lte: new Date(to + "T23:59:59.999Z"),
      },
      ...(statuses.length > 0 && { status: { in: statuses } }),
      ...(search && { clientName: { contains: search, mode: "insensitive" } }),
      ...(phone && { clientPhone: { contains: phone } }),
    };
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      orderItems: { include: { product: { select: { name: true } } } },
    },
    orderBy: { deliveryDate: "asc" },
  });

  const csv = buildOrdersCsvRows(orders);
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="labread-orders-${date}.csv"`,
    },
  });
}
