import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/cart/release-all — bulk-restore stock on session expiry or page unload.
// Accepts both JSON (explicit fetch) and text/plain (navigator.sendBeacon).
export async function POST(req: NextRequest) {
  let body: { sessionId?: string; items?: { productId: string; quantity: number }[] };

  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    body = await req.json().catch(() => ({}));
  } else {
    // sendBeacon sends as text/plain with no Content-Type
    const text = await req.text().catch(() => "{}");
    try { body = JSON.parse(text); } catch { body = {}; }
  }

  const { items } = body;
  if (!items?.length) return NextResponse.json({ success: true });

  await Promise.allSettled(
    items.map(({ productId, quantity }) =>
      prisma.product.update({
        where: { id: productId },
        data: { stockAmount: { increment: quantity } },
      }),
    ),
  );

  return NextResponse.json({ success: true });
}
