import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const schedules = await prisma.classSchedule.findMany({
    where: { isActive: true },
    include: {
      coach: { select: { firstName: true, lastName: true, nickname: true } },
      court: { include: { location: true } },
      sessions: {
        where: { isActive: true, date: { gte: new Date().toISOString().split("T")[0] } },
        include: {
          reservations: { where: { status: "CONFIRMED" } },
        },
        orderBy: { date: "asc" },
        take: 12,
      },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(schedules);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || (role !== "COACH" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, courtId, dayOfWeek, startTime, endTime, maxParticipants } = body;

  const schedule = await prisma.classSchedule.create({
    data: {
      title,
      coachId: (session.user as any).id,
      courtId,
      dayOfWeek,
      startTime,
      endTime,
      maxParticipants: maxParticipants || 6,
    },
  });

  return NextResponse.json(schedule);
}
