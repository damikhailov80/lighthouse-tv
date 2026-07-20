#!/usr/bin/env bash
# Build the React app and copy it into the Android assets so the WebView can
# load it from file:///android_asset/www/index.html.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

npm run build

DEST="$ROOT/android/app/src/main/assets/www"
rm -rf "$DEST"
mkdir -p "$DEST"
cp -r "$ROOT/dist/." "$DEST/"

echo "Web build copied to $DEST"
