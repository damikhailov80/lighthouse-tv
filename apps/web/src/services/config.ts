// Where the API is, and what to present to it.
//
// Three sources, most specific first:
//
//  1. The native shell, which installs LighthouseConfig on window the way it
//     installs LighthouseChannel. The values come from the APK's BuildConfig, so
//     the television is configured when it is built rather than by hand.
//  2. Build-time environment variables, for a web client served from somewhere.
//  3. A localhost default, so `npm run dev` works with nothing set.
//
// There is deliberately no settings screen: the address and the token would
// have to be typed on a D-pad, one character at a time, on the one device that
// makes that hardest.

declare global {
  interface Window {
    LighthouseConfig?: {
      apiBaseUrl(): string;
      deviceToken(): string;
    };
  }
}

const DEV_API_URL = "http://localhost:3000";

function fromNative(read: (config: NonNullable<Window["LighthouseConfig"]>) => string): string {
  const config = window.LighthouseConfig;
  if (config === undefined) return "";
  try {
    return read(config);
  } catch {
    // A bridge that throws is a bridge that is not there. The next source wins.
    return "";
  }
}

// No trailing slash, so paths can be appended without doubling it.
export function apiBaseUrl(): string {
  const url =
    fromNative((config) => config.apiBaseUrl()) ||
    import.meta.env.VITE_API_URL ||
    DEV_API_URL;
  return url.replace(/\/+$/, "");
}

export function deviceToken(): string {
  return fromNative((config) => config.deviceToken()) || import.meta.env.VITE_DEVICE_TOKEN || "";
}
