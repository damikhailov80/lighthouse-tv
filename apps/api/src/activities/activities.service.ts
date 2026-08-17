import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Activity as ActivityRow } from "@prisma/client";
import type { Activity, ActivityImage, PeriodUnit } from "@lighthouse/shared";
import { PrismaService } from "../prisma/prisma.service";
import { TenantContext } from "../tenant/tenant.context";
import type { CreateActivityDto, MarkDoneDto, UpdateActivityDto } from "./dto/activity.dto";

// A row as the clients want it. `unit` and `image` are stored as plain strings —
// the database is not the place to enforce a picture set that changes whenever
// an illustration is added — and are narrowed back here, on the way out, where
// they have already been through the DTOs on the way in.
export function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    title: row.title,
    every: row.every,
    unit: row.unit as PeriodUnit,
    lastDoneAt: row.lastDoneAt.toISOString(),
    ...(row.image === null ? {} : { image: row.image as ActivityImage }),
  };
}

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContext,
  ) {}

  // The live list. Tombstones stay in the table for the cleanup job and never
  // leave it: a deleted activity is gone as far as every screen is concerned.
  async list(): Promise<Activity[]> {
    const rows = await this.prisma.activity.findMany({
      where: { householdId: this.tenant.householdId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toActivity);
  }

  // Create, or update in place if this id has been seen before. Idempotent on
  // purpose: the id comes from the client, so a request retried after an unclear
  // failure lands on the row it already made.
  //
  // A soft-deleted row is revived rather than left dead, because the only way to
  // arrive here with a deleted id is a client acting on a list it fetched before
  // the delete — and reviving is undoable, while silently dropping the write is
  // the kind of loss nobody notices until much later.
  async upsert(dto: CreateActivityDto): Promise<Activity> {
    const householdId = this.tenant.householdId;

    // The id is a primary key across every household, so an upsert keyed on it
    // alone would let one household write over another's row. Clients generate
    // UUIDs and will never collide by accident, which is exactly why a collision
    // is worth refusing rather than absorbing.
    const existing = await this.prisma.activity.findUnique({ where: { id: dto.id } });
    if (existing !== null && existing.householdId !== householdId) {
      throw new ConflictException(`Activity id ${dto.id} is already taken`);
    }

    const lastDoneAt = dto.lastDoneAt === undefined ? new Date() : new Date(dto.lastDoneAt);
    const shared = {
      title: dto.title,
      every: dto.every,
      unit: dto.unit,
      image: dto.image ?? null,
    };

    const row = await this.prisma.activity.upsert({
      where: { id: dto.id },
      create: { id: dto.id, householdId, lastDoneAt, ...shared },
      update: { ...shared, deletedAt: null },
    });
    return toActivity(row);
  }

  async update(id: string, dto: UpdateActivityDto): Promise<Activity> {
    await this.require(id);
    const row = await this.prisma.activity.update({
      where: { id },
      data: {
        ...(dto.title === undefined ? {} : { title: dto.title }),
        ...(dto.every === undefined ? {} : { every: dto.every }),
        ...(dto.unit === undefined ? {} : { unit: dto.unit }),
        ...(dto.image === undefined ? {} : { image: dto.image }),
      },
    });
    return toActivity(row);
  }

  // Reset the timer, and keep the press. lastDoneAt is what the traffic light
  // reads; the completions row is the history that overwriting it used to
  // destroy, and that cannot be reconstructed afterwards.
  //
  // lastDoneAt only ever moves forward: two clients can report the same activity
  // done seconds apart, and the later report must not be undone by the earlier
  // one arriving second.
  async markDone(id: string, dto: MarkDoneDto): Promise<Activity> {
    const existing = await this.require(id);
    const doneAt = dto.doneAt === undefined ? new Date() : new Date(dto.doneAt);
    const lastDoneAt = doneAt > existing.lastDoneAt ? doneAt : existing.lastDoneAt;

    const [row] = await this.prisma.$transaction([
      this.prisma.activity.update({ where: { id }, data: { lastDoneAt } }),
      this.prisma.completion.create({ data: { activityId: id, doneAt } }),
    ]);
    return toActivity(row);
  }

  // Soft delete: the row stays for a while so the press is undoable and the
  // completion history survives. CleanupService clears it out later.
  async remove(id: string): Promise<void> {
    await this.require(id);
    await this.prisma.activity.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // Every mutation goes through here first, so an id belonging to another
  // household reads exactly like an id that does not exist.
  private async require(id: string): Promise<ActivityRow> {
    const row = await this.prisma.activity.findFirst({
      where: { id, householdId: this.tenant.householdId, deletedAt: null },
    });
    if (row === null) throw new NotFoundException(`No activity ${id}`);
    return row;
  }
}
