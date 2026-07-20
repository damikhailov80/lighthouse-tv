import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// viteSingleFile inlines all JS and CSS into a single index.html. This is what
// lets the Android WebView load the app from file://android_asset/www/index.html
// without any cross-origin module/asset fetches (which file:// blocks).
// base: "./" keeps any remaining references relative, just in case.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: "./",
});
