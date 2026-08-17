// The same nine activities the app used to fall back to on a device with an
// empty localStorage, now put in the database once so that every screen starts
// on the same list. Their ids are "1".."9" rather than UUIDs, which is why the
// primary key is a plain string.
//
// skipDuplicates makes a second run a no-op, so this is safe to leave in a
// setup script.
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(__dirname, "../../../.env") });

import { PrismaClient } from "@prisma/client";
import { seedActivities } from "@lighthouse/shared";

const DEFAULT_HOUSEHOLD_ID = "default";

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const result = await prisma.activity.createMany({
      data: seedActivities().map((activity) => ({
        id: activity.id,
        householdId: DEFAULT_HOUSEHOLD_ID,
        title: activity.title,
        every: activity.every,
        unit: activity.unit,
        lastDoneAt: new Date(activity.lastDoneAt),
        image: activity.image ?? null,
      })),
      skipDuplicates: true,
    });
    console.log(`Seeded ${result.count} activities`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
