import { SetMetadata } from "@nestjs/common";

export const PUBLIC_ROUTE = "lighthouse:public";

// Opens a route to unauthenticated callers. Only /health wears it: something has
// to be able to say the API is up without holding the household's token.
export const Public = () => SetMetadata(PUBLIC_ROUTE, true);
