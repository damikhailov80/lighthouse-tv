import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve } from "node:path";

// One .env at the repository root serves the API, Prisma and this app, so the
// device token is written down once under one name. Vite only exposes variables
// it can see and only when they are VITE_-prefixed, so the two the bundle needs
// are read from there and substituted in by hand.
//
// Values still reach a television through the native bridge instead — see
// src/services/config.ts. These are for `npm run dev` and for a web build.
const ROOT_ENV_DIR = resolve(__dirname, "../..");

// viteSingleFile inlines all JS and CSS into a single index.html. This is what
// lets the Android WebView load the app from file://android_asset/www/index.html
// without any cross-origin module/asset fetches (which file:// blocks).
// base: "./" keeps any remaining references relative, just in case.
export default defineConfig(({ mode }) => {
  // "" rather than "VITE_": the names in .env are the ones the API uses.
  const env = loadEnv(mode, ROOT_ENV_DIR, "");
  const isDev = mode !== "production";

  // The local DEVICE_TOKEN stands in only while developing, so `npm run dev`
  // works with nothing extra set. A production build must be given
  // VITE_DEVICE_TOKEN on purpose — otherwise `npm run tv:build`, which is a
  // production build, would bake a token into the APK's bundle that the native
  // bridge is there to supply and that has no business being in there twice.
  const token = env.VITE_DEVICE_TOKEN ?? (isDev ? env.DEVICE_TOKEN : undefined);

  return {
    plugins: [react(), viteSingleFile()],
    base: "./",
    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify(
        env.VITE_API_URL ?? (isDev ? `http://localhost:${env.API_PORT ?? 3000}` : ""),
      ),
      "import.meta.env.VITE_DEVICE_TOKEN": JSON.stringify(token ?? ""),
    },
  };
});
