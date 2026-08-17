import { Injectable } from "@nestjs/common";
import {
  dayKey,
  dueLabel,
  heroOf,
  layoutOf,
  periodShort,
  recommendedActivities,
  watchNextActivity,
  type Activity,
  type ChannelCard,
  type DayLayout,
  type Today,
} from "@lighthouse/shared";
import { ActivitiesService } from "../activities/activities.service";
import { PrismaService } from "../prisma/prisma.service";
import { TenantContext } from "../tenant/tenant.context";

function cardFor(activity: Activity, now: Date): ChannelCard {
  return {
    id: activity.id,
    title: activity.title,
    subtitle: `${dueLabel(activity, now)} · ${periodShort(activity)}`,
    ...(activity.image === undefined ? {} : { image: activity.image }),
  };
}

@Injectable()
export class TodayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activities: ActivitiesService,
    private readonly tenant: TenantContext,
  ) {}

  async get(now: Date = new Date()): Promise<Today> {
    const activities = await this.activities.list();
    const day = dayKey(now);

    if (activities.length === 0) {
      return { day, hero: null, rows: [], cards: [], watchNext: null };
    }

    const { heroId, rows } = await this.pickOfTheDay(activities, day, now);
    const byId = new Map(activities.map((activity) => [activity.id, activity]));
    const hero = heroId === null ? null : (byId.get(heroId) ?? null);
    const layout: DayLayout = { day, rows };
    const next = watchNextActivity(activities, layout, heroId, now);

    return {
      day,
      hero,
      rows,
      cards: recommendedActivities(activities, now).map((activity) => cardFor(activity, now)),
      watchNext: next === undefined ? null : cardFor(next, now),
    };
  }

  // The day's decision, taken once and then held.
  //
  // Held because marking something done must recolour a card where it stands
  // rather than rearrange the screen; stored per household rather than per
  // device because the television, the web and a photo frame have to name the
  // same thing.
  //
  // Several clients can arrive at once just after midnight and all find nothing
  // stored. They all deal a layout, they all try to insert, one wins on the
  // composite primary key, and the rest read what the winner wrote — which is
  // why the insert is followed by a read rather than trusted.
  private async pickOfTheDay(
    activities: Activity[],
    day: string,
    now: Date,
  ): Promise<{ heroId: string | null; rows: DayLayout["rows"] }> {
    const householdId = this.tenant.householdId;

    const key = { householdId_day: { householdId, day } };
    let stored = await this.prisma.dayPick.findUnique({ where: key });

    if (stored === null) {
      // The suggestions are dealt around the banner's pick, so it is decided
      // first — dealing them the other way round would offer the activity the
      // banner is already showing.
      const heroId = heroOf(activities, now)?.id ?? null;
      const rows = layoutOf(activities, now, heroId).rows;

      await this.prisma.dayPick.createMany({
        data: [{ householdId, day, heroId, rows }],
        skipDuplicates: true,
      });
      // Read back rather than trust the write: on a tie another client's layout
      // is the one that is now stored, and this one must return that.
      stored = await this.prisma.dayPick.findUnique({ where: key });
      if (stored === null) return { heroId, rows };
    }

    // A stored pick can name an activity that has since been deleted. The
    // banner then falls back to the most urgent one, exactly as it does on a
    // day with no pick at all.
    const pinned = stored.heroId;
    const heroId =
      pinned !== null && activities.some((activity) => activity.id === pinned)
        ? pinned
        : (heroOf(activities, now)?.id ?? null);

    return { heroId, rows: stored.rows as DayLayout["rows"] };
  }
}
