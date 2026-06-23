import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/catalog — public (used by both shop and admin)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const adminView = searchParams.get("admin") === "true";

  const session = adminView ? await auth() : null;
  if (adminView && !session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: adminView ? undefined : { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

const ProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().max(200).optional().nullable(),
  price: z.number().positive(),
  pictureUrl: z.string().optional().nullable(),
  availableDays: z.array(z.enum(["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"])),
  isVegan: z.boolean().default(false),
  containsAllergens: z.boolean().default(false),
  containsDairy: z.boolean().default(false),
  stockAmount: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  category: z.enum(["BREAD", "PASTRY"]).optional().nullable(),
});

// POST /api/catalog — admin only
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ProductSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const product = await prisma.product.create({ data: parsed.data });
  return NextResponse.json(product, { status: 201 });
}
