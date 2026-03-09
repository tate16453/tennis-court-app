import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Locations
  const crystal = await prisma.location.upsert({
    where: { name: "CRYSTAL" },
    update: {},
    create: { name: "CRYSTAL", displayName: "Krystal" },
  });

  const crystalG = await prisma.location.upsert({
    where: { name: "CRYSTAL_G" },
    update: {},
    create: { name: "CRYSTAL_G", displayName: "Krystal G" },
  });

  // Courts for Krystal (8 courts)
  for (let i = 1; i <= 8; i++) {
    await prisma.court.upsert({
      where: { id: `crystal-court-${i}` },
      update: {},
      create: { id: `crystal-court-${i}`, number: i, name: `Court ${i}`, locationId: crystal.id },
    });
  }

  // Courts for Krystal G (9 courts)
  for (let i = 1; i <= 9; i++) {
    await prisma.court.upsert({
      where: { id: `crystalg-court-${i}` },
      update: {},
      create: { id: `crystalg-court-${i}`, number: i, name: `Court ${i}`, locationId: crystalG.id },
    });
  }

  // Admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@crystal.tennis" },
    update: {},
    create: {
      email: "admin@crystal.tennis",
      password: adminPassword,
      firstName: "Admin",
      lastName: "Krystal",
      role: "ADMIN",
    },
  });

  // Coach user
  const coachPassword = await bcrypt.hash("coach123", 10);
  const coach = await prisma.user.upsert({
    where: { email: "coach@crystal.tennis" },
    update: {},
    create: {
      email: "coach@crystal.tennis",
      password: coachPassword,
      firstName: "Coach",
      lastName: "Pro",
      nickname: "Coach Pro",
      role: "COACH",
    },
  });

  // Sample class schedules
  const sampleClasses = [
    { title: "Beginner Tennis", dayOfWeek: 1, startTime: "07:00", endTime: "08:30", courtId: "crystal-court-1" },
    { title: "Beginner Tennis", dayOfWeek: 3, startTime: "07:00", endTime: "08:30", courtId: "crystal-court-1" },
    { title: "Intermediate Tennis", dayOfWeek: 2, startTime: "09:00", endTime: "10:30", courtId: "crystal-court-2" },
    { title: "Intermediate Tennis", dayOfWeek: 4, startTime: "09:00", endTime: "10:30", courtId: "crystal-court-2" },
    { title: "Advanced Tennis", dayOfWeek: 6, startTime: "06:00", endTime: "08:00", courtId: "crystalg-court-1" },
    { title: "Kids Tennis", dayOfWeek: 0, startTime: "09:00", endTime: "10:00", courtId: "crystalg-court-2" },
    { title: "Ladies Group", dayOfWeek: 5, startTime: "10:00", endTime: "11:30", courtId: "crystal-court-3" },
  ];

  for (const cls of sampleClasses) {
    const existing = await prisma.classSchedule.findFirst({
      where: { coachId: coach.id, title: cls.title, dayOfWeek: cls.dayOfWeek, startTime: cls.startTime },
    });
    if (!existing) {
      const schedule = await prisma.classSchedule.create({
        data: { ...cls, coachId: coach.id, maxParticipants: 6 },
      });

      // Create upcoming sessions for next 4 weeks
      const today = new Date();
      for (let week = 0; week < 4; week++) {
        const date = new Date(today);
        const daysUntilTarget = (cls.dayOfWeek - today.getDay() + 7) % 7 + week * 7;
        date.setDate(today.getDate() + daysUntilTarget);
        const dateStr = date.toISOString().split("T")[0];
        await prisma.classSession.create({
          data: { classScheduleId: schedule.id, date: dateStr, isActive: true },
        });
      }
    }
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
