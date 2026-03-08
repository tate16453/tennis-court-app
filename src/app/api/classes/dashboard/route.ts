import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || (role !== "COACH" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  const schedules = await prisma.classSchedule.findMany({
    include: {
      coach: { select: { firstName: true, lastName: true, nickname: true } },
      court: { include: { location: true } },
      sessions: {
        where: { date: { gte: today } },
        include: {
          reservations: {
            where: { status: "CONFIRMED" },
            select: { id: true, firstName: true, lastName: true, nickname: true, lineUserId: true },
          },
        },
        orderBy: { date: "asc" },
        take: 8,
      },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(schedules);
}
