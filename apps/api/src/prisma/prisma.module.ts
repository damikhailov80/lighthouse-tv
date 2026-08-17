import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

// Global so that every feature module does not have to import it to reach the
// one database connection there is.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
