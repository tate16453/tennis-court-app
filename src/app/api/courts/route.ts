import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const locations = await prisma.location.findMany({
    include: { courts: { orderBy: { number: "asc" } } },
  });
  return NextResponse.json(locations);
}
