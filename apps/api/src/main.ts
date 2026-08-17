// The household's timezone is applied to the process before anything reads a
// clock, because dayKey() in @lighthouse/shared asks a Date for its local
// calendar day. The server decides "today" for every screen now, so that day
// has to be the household's rather than whatever the machine was configured
// with — a container defaulting to UTC would roll the banner over three hours
// early. Absolute time is unaffected: only local getters follow TZ, so statusOf
// still measures from the real instant.
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(__dirname, "../../../.env") });
process.env.TZ = process.env.HOUSEHOLD_TZ ?? process.env.TZ ?? "UTC";

import "reflect-metadata";
import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      // Strips properties no DTO declares. This is what makes householdId
      // unspoofable: a client can send one, and it is gone before any service
      // sees the body.
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // The app runs from file:///android_asset/www/index.html inside the TV's
  // WebView, which sends `Origin: null`. No cookies are involved — the device
  // token travels in a header — so a wildcard is both correct and enough, and
  // it saves rehosting the bundle behind WebViewAssetLoader just to have an
  // origin CORS can name.
  app.enableCors({ origin: "*" });

  const port = Number(process.env.API_PORT ?? 3000);
  // 0.0.0.0 and not localhost: the clients are other devices.
  await app.listen(port, "0.0.0.0");

  const logger = new Logger("Bootstrap");
  logger.log(`Listening on 0.0.0.0:${port}`);
  // Logged because a wrong timezone shows up only as the day's picks turning
  // over at the wrong hour, once, and then looking fine again.
  logger.log(`Household timezone: ${process.env.TZ}`);
}

void bootstrap();
