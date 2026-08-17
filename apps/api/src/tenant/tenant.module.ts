import { Global, Module } from "@nestjs/common";
import { TenantContext } from "./tenant.context";

// Global for the same reason PrismaModule is: every feature needs it, and a
// feature that forgot to import it would be a feature querying across
// households.
@Global()
@Module({
  providers: [TenantContext],
  exports: [TenantContext],
})
export class TenantModule {}
