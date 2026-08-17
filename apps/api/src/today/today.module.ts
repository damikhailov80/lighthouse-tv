import { Module } from "@nestjs/common";
import { ActivitiesModule } from "../activities/activities.module";
import { TodayController } from "./today.controller";
import { TodayService } from "./today.service";

@Module({
  imports: [ActivitiesModule],
  controllers: [TodayController],
  providers: [TodayService],
})
export class TodayModule {}
