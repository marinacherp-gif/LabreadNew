import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Announcement } from "@/types";

// GET /api/public/bakery-info — unauthenticated, SEO-indexable
export async function GET() {
  const config = await prisma.bakeryConfig
    .findUnique({ where: { id: 1 } })
    .catch(() => null);

  const today = new Date().toISOString().split("T")[0];

  let activeAnnouncements: Announcement[] = [];
  if (config?.specialAnnouncements) {
    try {
      const all: Announcement[] = JSON.parse(config.specialAnnouncements);
      activeAnnouncements = all.filter(
        (a) => a.isActive && a.startDate <= today && (a.endDate === null || a.endDate >= today)
      );
    } catch {
      // legacy plain-text value — ignore
    }
  }

  const data = {
    bakeryName: "Labread",
    workingHours: config?.workingHours ?? {},
    activeAnnouncements,
    updatedAt: config?.updatedAt ?? null,
  };

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
