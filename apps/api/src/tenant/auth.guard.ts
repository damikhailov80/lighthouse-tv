import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { timingSafeEqual } from "node:crypto";
import { PUBLIC_ROUTE } from "./public.decorator";
import { DEFAULT_HOUSEHOLD_ID, type RequestWithTenant } from "./tenant.types";

// Constant-time compare, so the length of a wrong guess is all that a caller
// can learn from how long the answer takes.
function matches(presented: string, expected: string): boolean {
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// The seat real authentication will take.
//
// There is no sign-in yet — one household, one list — but the API answers around
// the clock from an address anyone could find, and without this it would be a
// list anyone could rewrite. So every client sends one shared token, built into
// it rather than typed: a television remote has no keyboard.
//
// What matters for later is the shape, not the check. This guard is the only
// place that decides who a request is for, and it says so by putting a Tenant on
// the request. Swapping the token for a JWT means rewriting the body of
// canActivate and reading householdId out of a claim; the services, the queries
// and the schema stay as they are.
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  private readonly token: string;

  constructor(
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {
    this.token = this.config.get<string>("DEVICE_TOKEN", "");
    if (this.token === "") {
      // Refusing to start would be worse: the one thing a household server must
      // do is come back up. Saying so loudly on every boot is the next best.
      this.logger.error(
        "DEVICE_TOKEN is empty — every request will be rejected. Set it in .env.",
      );
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const header = request.headers.authorization ?? "";
    const presented = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";

    if (this.token === "" || !matches(presented, this.token)) {
      throw new UnauthorizedException("Invalid or missing device token");
    }

    request.tenant = { householdId: DEFAULT_HOUSEHOLD_ID };
    return true;
  }
}
