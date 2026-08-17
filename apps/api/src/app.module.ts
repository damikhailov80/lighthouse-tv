import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ActivitiesModule } from "./activities/activities.module";
import { CleanupModule } from "./cleanup/cleanup.module";
import { HealthController } from "./health/health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthGuard } from "./tenant/auth.guard";
import { TenantModule } from "./tenant/tenant.module";
import { TodayModule } from "./today/today.module";

@Module({
  imports: [
    // The repository root, so one .env serves the API, Prisma and the scripts.
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ["../../.env"] }),
    ScheduleModule.forRoot(),
    PrismaModule,
    TenantModule,
    ActivitiesModule,
    TodayModule,
    CleanupModule,
  ],
  controllers: [HealthController],
  providers: [
    // Applied to every route rather than to each controller: a route that is
    // meant to be open says so with @Public(), and one that forgets to say
    // anything is closed. The other way round, a forgotten decorator would
    // publish the household's list.
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
