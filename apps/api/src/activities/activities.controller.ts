import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import type { Activity } from "@lighthouse/shared";
import { ActivitiesService } from "./activities.service";
import { CreateActivityDto, MarkDoneDto, UpdateActivityDto } from "./dto/activity.dto";

@Controller("activities")
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @Get()
  list(): Promise<Activity[]> {
    return this.activities.list();
  }

  // 200 rather than 201: the id comes from the client and the same request may
  // be sent twice, so "created" is not something this can honestly report.
  @Post()
  @HttpCode(HttpStatus.OK)
  create(@Body() dto: CreateActivityDto): Promise<Activity> {
    return this.activities.upsert(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateActivityDto): Promise<Activity> {
    return this.activities.update(id, dto);
  }

  @Post(":id/done")
  @HttpCode(HttpStatus.OK)
  markDone(@Param("id") id: string, @Body() dto: MarkDoneDto): Promise<Activity> {
    return this.activities.markDone(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string): Promise<void> {
    return this.activities.remove(id);
  }
}
