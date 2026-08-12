#!/usr/bin/env bash
# Run an adb command against the running emulator, whatever its serial is, so
# the emulator scripts keep working while the real TV is also connected.
set -euo pipefail

SERIAL="$(adb devices | awk '/^emulator-[0-9]+/ { print $1; exit }')"
if [ -z "$SERIAL" ]; then
  echo "No emulator running. Start one with: npm run emu:start" >&2
  exit 1
fi

exec adb -s "$SERIAL" "$@"
