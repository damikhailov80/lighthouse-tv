import { Controller, Get } from "@nestjs/common";
import { TodayService } from "./today.service";
import type { Today } from "./today.types";

@Controller("today")
export class TodayController {
  constructor(private readonly today: TodayService) {}

  @Get()
  get(): Promise<Today> {
    return this.today.get();
  }
}
