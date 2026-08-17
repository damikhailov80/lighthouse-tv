import { Inject, Injectable, InternalServerErrorException, Scope } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import type { RequestWithTenant } from "./tenant.types";

// The only way a service learns which household it is working for.
//
// Nothing reads householdId off a request body, and no DTO carries one — the
// global ValidationPipe strips unknown properties, so a client that sends one is
// simply ignored. That is the whole reason this exists as a provider rather than
// as a parameter threaded through every method: it cannot be spoofed and it
// cannot be forgotten.
@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  constructor(@Inject(REQUEST) private readonly request: RequestWithTenant) {}

  get householdId(): string {
    const householdId = this.request.tenant?.householdId;
    if (householdId === undefined) {
      // Only reachable if a route is served without AuthGuard having run.
      // Failing here beats quietly reading somebody else's list.
      throw new InternalServerErrorException("Request reached a service with no tenant");
    }
    return householdId;
  }
}
