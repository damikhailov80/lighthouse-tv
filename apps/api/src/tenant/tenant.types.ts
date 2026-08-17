import type { Request } from "express";

// Who the request is acting for. Today it only ever holds the one household;
// the point of naming it is that everything downstream already reads it from
// here, so adding real users changes who fills it in and nothing else.
export interface Tenant {
  householdId: string;
}

export interface RequestWithTenant extends Request {
  tenant?: Tenant;
}

// The household every request belongs to while there is no sign-in. It is a
// value in the data, not a special case in the code: rows carry it, queries
// filter on it, and the day it stops being a constant nothing else has to move.
export const DEFAULT_HOUSEHOLD_ID = "default";
