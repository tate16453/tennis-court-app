import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || (role !== "COACH" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { classScheduleId, date, isActive } = body;

  // Upsert session
  const existing = await prisma.classSession.findFirst({
    where: { classScheduleId, date },
  });

  if (existing) {
    const updated = await prisma.classSession.update({
      where: { id: existing.id },
      data: { isActive: isActive ?? true },
    });
    return NextResponse.json(updated);
  }

  const classSession = await prisma.classSession.create({
    data: { classScheduleId, date, isActive: isActive ?? true },
  });
  return NextResponse.json(classSession);
}
