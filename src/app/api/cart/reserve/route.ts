import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/cart/reserve — atomically decrement 1 unit of stock
// Uses a transaction to prevent overselling under concurrent requests.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { productId } = body ?? {};

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { stockAmount: true, isActive: true },
      });

      if (!product?.isActive) throw new Error("Product unavailable");
      if (product.stockAmount < 1) throw new Error("Out of stock");

      await tx.product.update({
        where: { id: productId },
        data: { stockAmount: { decrement: 1 } },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Reservation failed";
    return NextResponse.json({ error: msg }, { status: 409 });
  }
}
