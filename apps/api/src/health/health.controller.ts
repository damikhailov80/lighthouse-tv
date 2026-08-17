import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Public } from "../tenant/public.decorator";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  // Public: a client that cannot reach the API needs to be able to tell "the
  // server is down" from "my token is wrong", and a monitor should not have to
  // hold the household's secret to watch the process.
  //
  // Touches the database, because an API that is up but cannot reach Postgres
  // is down as far as every screen is concerned.
  @Public()
  @Get()
  async check(): Promise<{ status: string; database: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ok", database: "up" };
    } catch {
      return { status: "degraded", database: "down" };
    }
  }
}
