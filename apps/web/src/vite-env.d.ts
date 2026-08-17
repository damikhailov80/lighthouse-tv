/// <reference types="vite/client" />

// Baked into the bundle at build time. Both are optional: the television gets
// its values from the native shell instead, and `npm run dev` falls back to
// localhost with no token. See services/config.ts.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_DEVICE_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
