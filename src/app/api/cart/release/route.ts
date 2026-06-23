import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/cart/release — return 1 unit back to stock when user decrements
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { productId, quantity = 1 } = body ?? {};

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  await prisma.product
    .update({
      where: { id: productId },
      data: { stockAmount: { increment: quantity } },
    })
    .catch(() => {});

  return NextResponse.json({ success: true });
}
