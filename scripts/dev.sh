#!/usr/bin/env bash
# Everything needed to work on the app at once: the database, the shared package
# rebuilding as it is edited, the API, and Vite.
#
# The shared watcher is the reason this exists rather than four terminals — both
# apps consume its dist/, so an edit there is invisible until tsc has run.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

npm run db:up

# Built once up front: the API will not start against a stale or missing dist/,
# and the watcher only takes over from here.
npm -w @lighthouse/shared run build

pids=()
# Kill the whole group on the way out, so Ctrl-C does not leave a watcher and a
# Nest process behind holding the port.
cleanup() {
  trap - EXIT INT TERM
  for pid in "${pids[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

npm -w @lighthouse/shared run dev & pids+=($!)
npm -w @lighthouse/api run dev & pids+=($!)
npm -w @lighthouse/web run dev & pids+=($!)

wait -n
