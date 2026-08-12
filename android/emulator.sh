#!/usr/bin/env bash
# Start the Android TV emulator (unless one is already running) and wait until
# it has finished booting. Pass --list to only print the available AVDs, or
# --reboot to restart the running emulator and wait for it to come back.
#
#   AVD=Pixel_9a bash android/emulator.sh   # pick a different virtual device
set -euo pipefail

SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
EMULATOR="$SDK/emulator/emulator"
AVD="${AVD:-Television_4K}"
LOG="${TMPDIR:-/tmp}/lighthouse-emulator.log"

if [ ! -x "$EMULATOR" ]; then
  echo "Emulator binary not found at $EMULATOR" >&2
  echo "Set ANDROID_HOME to your SDK location." >&2
  exit 1
fi

emu_serial() { adb devices | awk '/^emulator-[0-9]+/ { print $1; exit }'; }

booted() {
  [ "$(adb -s "$1" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]
}

wait_for_boot() {
  adb -s "$1" wait-for-device
  echo "Waiting for '$1' to finish booting…"
  for _ in $(seq 1 180); do
    if booted "$1"; then
      echo "Emulator $1 is ready."
      return 0
    fi
    sleep 2
  done
  echo "Emulator $1 did not report sys.boot_completed in time. See $LOG" >&2
  return 1
}

case "${1:-}" in
  --list)
    "$EMULATOR" -list-avds
    exit 0
    ;;
  --reboot)
    SERIAL="$(emu_serial)"
    if [ -z "$SERIAL" ]; then
      echo "No emulator running. Start one with: npm run emu:start" >&2
      exit 1
    fi
    echo "Rebooting ${SERIAL}…"
    adb -s "$SERIAL" reboot
    # Wait for the old session to actually go down, otherwise the boot check
    # would immediately succeed on the still-alive pre-reboot system.
    for _ in $(seq 1 30); do
      booted "$SERIAL" || break
      sleep 1
    done
    wait_for_boot "$SERIAL"
    exit 0
    ;;
esac

if [ -n "$(emu_serial)" ]; then
  echo "Emulator already running: $(emu_serial)"
else
  if ! "$EMULATOR" -list-avds | grep -qx "$AVD"; then
    echo "AVD '$AVD' not found. Available:" >&2
    "$EMULATOR" -list-avds >&2
    exit 1
  fi

  echo "Starting AVD '$AVD' (log: $LOG)…"
  nohup "$EMULATOR" -avd "$AVD" -netdelay none -netspeed full \
    </dev/null >"$LOG" 2>&1 &

  for _ in $(seq 1 120); do
    [ -n "$(emu_serial)" ] && break
    sleep 1
  done
fi

SERIAL="$(emu_serial)"
if [ -z "$SERIAL" ]; then
  echo "Emulator did not show up in 'adb devices'. See $LOG" >&2
  exit 1
fi

wait_for_boot "$SERIAL"
