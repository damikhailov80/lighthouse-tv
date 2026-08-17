// The Prisma CLI runs with this workspace as its working directory and would
// look for .env here. There is one .env, at the repository root, shared by the
// API, the CLI and the scripts — so it is loaded explicitly.
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "prisma/config";

loadEnv({ path: resolve(__dirname, "../../.env") });

export default defineConfig({
  schema: resolve(__dirname, "prisma", "schema.prisma"),
  migrations: {
    path: resolve(__dirname, "prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
});
