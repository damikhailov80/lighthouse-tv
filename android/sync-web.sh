#!/usr/bin/env bash
# Build the React app and copy it into the Android assets so the WebView can
# load it from file:///android_asset/www/index.html, and copy the illustrations
# into the APK's resources for the home-screen channel.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

npm run build

DEST="$ROOT/android/app/src/main/assets/www"
rm -rf "$DEST"
mkdir -p "$DEST"
cp -r "$ROOT/dist/." "$DEST/"

echo "Web build copied to $DEST"

# The home-screen channel's cards are drawn by the launcher, in its own process,
# which cannot read the base64 the single-file build inlines. So the same
# pictures go into the APK a second time as resources, where they can be handed
# out as android.resource:// URIs — see RecommendationChannel.posterUri.
#
# -nodpi: the files are one fixed size (720px wide) rather than one density's
# worth of a size, so the framework must not rescale them.
#
# Wiped and rewritten every build, so a renamed or deleted illustration cannot
# stay behind in the APK. Resource names allow only lowercase, digits and
# underscores, hence board-games.jpg -> img_board_games.jpg.
IMAGES="$ROOT/android/app/src/main/res/drawable-nodpi"
rm -rf "$IMAGES"
mkdir -p "$IMAGES"
for image in "$ROOT/src/assets"/*.jpg; do
  name="$(basename "$image" .jpg | tr '-' '_')"
  cp "$image" "$IMAGES/img_$name.jpg"
done

echo "Illustrations copied to $IMAGES"
