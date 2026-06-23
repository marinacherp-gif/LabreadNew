import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Announcement } from "@/types";

function parseAnnouncements(raw: string | null): Announcement[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// GET /api/config — admin read (see also /api/public/bakery-info)
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await getOrCreateConfig();
  return NextResponse.json({
    ...config,
    announcements: parseAnnouncements(config.specialAnnouncements),
  });
}

const AnnouncementSchema = z.object({
  id: z.string(),
  text: z.string(),
  isActive: z.boolean(),
  startDate: z.string(),
  endDate: z.string().nullable(),
});

const ConfigSchema = z.object({
  workingHours: z.record(z.string()).optional(),
  announcements: z.array(AnnouncementSchema).optional(),
});

// PATCH /api/config — ADMIN and VIEWER both allowed (per spec)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = ConfigSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const announcementsJson =
    parsed.data.announcements !== undefined
      ? JSON.stringify(parsed.data.announcements)
      : undefined;

  const config = await prisma.bakeryConfig.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      workingHours: parsed.data.workingHours ?? {},
      specialAnnouncements: announcementsJson ?? null,
    },
    update: {
      ...(parsed.data.workingHours !== undefined && { workingHours: parsed.data.workingHours }),
      ...(announcementsJson !== undefined && { specialAnnouncements: announcementsJson }),
    },
  });

  return NextResponse.json({
    ...config,
    announcements: parseAnnouncements(config.specialAnnouncements),
  });
}

async function getOrCreateConfig() {
  return prisma.bakeryConfig.upsert({
    where: { id: 1 },
    create: { id: 1, workingHours: {}, specialAnnouncements: null },
    update: {},
  });
}
