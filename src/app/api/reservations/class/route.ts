import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { classSessionId, firstName, lastName, nickname, lineUserId } = body;

  if (!classSessionId || !firstName || !lastName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const classSession = await prisma.classSession.findUnique({
    where: { id: classSessionId },
    include: {
      classSchedule: true,
      reservations: { where: { status: "CONFIRMED" } },
    },
  });

  if (!classSession || !classSession.isActive) {
    return NextResponse.json({ error: "Session not available" }, { status: 404 });
  }

  if (classSession.reservations.length >= classSession.classSchedule.maxParticipants) {
    return NextResponse.json({ error: "Class is full" }, { status: 409 });
  }

  // Check if user already booked
  const alreadyBooked = await prisma.classReservation.findFirst({
    where: { userId: (session.user as any).id, classSessionId, status: "CONFIRMED" },
  });
  if (alreadyBooked) {
    return NextResponse.json({ error: "Already registered for this class" }, { status: 409 });
  }

  const reservation = await prisma.classReservation.create({
    data: {
      userId: (session.user as any).id,
      classSessionId,
      firstName,
      lastName,
      nickname,
      lineUserId,
      status: "CONFIRMED",
    },
  });

  return NextResponse.json(reservation);
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reservations = await prisma.classReservation.findMany({
    where: { userId: (session.user as any).id },
    include: {
      classSession: {
        include: { classSchedule: { include: { court: { include: { location: true } }, coach: { select: { firstName: true, lastName: true } } } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reservations);
}
