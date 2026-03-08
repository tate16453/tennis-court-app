import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { courtId, date, startTime, endTime, firstName, lastName, nickname, lineUserId } = body;

  if (!courtId || !date || !startTime || !endTime || !firstName || !lastName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check for conflicts
  const conflict = await prisma.courtReservation.findFirst({
    where: {
      courtId,
      date,
      status: "CONFIRMED",
      OR: [
        { AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }] },
        { AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }] },
        { AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }] },
      ],
    },
  });

  if (conflict) {
    return NextResponse.json({ error: "Court already booked for this time" }, { status: 409 });
  }

  const reservation = await prisma.courtReservation.create({
    data: {
      userId: (session.user as any).id,
      courtId,
      date,
      startTime,
      endTime,
      firstName,
      lastName,
      nickname,
      lineUserId,
      status: "CONFIRMED",
    },
    include: { court: { include: { location: true } } },
  });

  return NextResponse.json(reservation);
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const reservations = await prisma.courtReservation.findMany({
    where: { userId },
    include: { court: { include: { location: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(reservations);
}
