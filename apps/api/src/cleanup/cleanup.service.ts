import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";

// How long a deleted activity is kept before it goes for good. A soft delete
// exists so that two presses of a D-pad are undoable; three months is far past
// the point where anyone would still want it back, and keeping tombstones
// forever means a table that only ever grows.
const TOMBSTONE_DAYS = 90;

// How long the day's picks are kept. They are a decision about one screen on
// one day, worth nothing the morning after; a month is enough to look back at
// what was suggested when something looks wrong.
const DAY_PICK_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

// Completions are never cleaned up. They are the history the list itself does
// not keep — the whole reason the table exists — and there is roughly one row
// per activity per period, which is a handful a day for a household.
@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Across every household: this is housekeeping, not a request, so it has no
  // tenant and must not inject one.
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async purge(now: Date = new Date()): Promise<void> {
    const activities = await this.prisma.activity.deleteMany({
      where: { deletedAt: { lt: new Date(now.getTime() - TOMBSTONE_DAYS * DAY_MS) } },
    });
    const dayPicks = await this.prisma.dayPick.deleteMany({
      where: { createdAt: { lt: new Date(now.getTime() - DAY_PICK_DAYS * DAY_MS) } },
    });

    if (activities.count > 0 || dayPicks.count > 0) {
      this.logger.log(
        `Purged ${activities.count} deleted activities and ${dayPicks.count} day picks`,
      );
    }
  }
}
