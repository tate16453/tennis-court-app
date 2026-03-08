import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date) return NextResponse.json({ error: "Date required" }, { status: 400 });

  const reservations = await prisma.courtReservation.findMany({
    where: { date, status: "CONFIRMED" },
    include: { court: { include: { location: true } } },
  });

  return NextResponse.json(reservations);
}
