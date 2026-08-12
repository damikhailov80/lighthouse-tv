#!/usr/bin/env bash
# Run an adb command against the television, so the TV scripts keep working
# while an emulator is also connected. The mirror of adb-emu.sh — without it,
# adb refuses every command with "more than one device/emulator", and the one
# that matters is `install`, in the middle of tv:deploy, right after a build
# that has just printed BUILD SUCCESSFUL.
set -euo pipefail

SERIAL="${TV_IP:-192.168.1.11}:5555"
STATE="$(adb devices | awk -v serial="$SERIAL" '$1 == serial { print $2; exit }')"

if [ "$STATE" != "device" ]; then
  if [ -z "$STATE" ]; then
    echo "TV $SERIAL is not connected. Connect it with: npm run tv:connect" >&2
  else
    echo "TV $SERIAL is connected but '$STATE', not 'device'." >&2
    echo "'unauthorized' means the debugging prompt on the TV was not accepted." >&2
  fi
  exit 1
fi

exec adb -s "$SERIAL" "$@"
