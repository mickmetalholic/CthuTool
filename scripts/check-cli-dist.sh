#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
expected="$repo_root/apps/cli/dist/index.js"
actual_dir="$(mktemp -d "${TMPDIR:-/tmp}/cthutool-cli-dist.XXXXXX")"
actual="$actual_dir/index.js"

cleanup() {
  rm -rf "$actual_dir"
}
trap cleanup EXIT

if [ ! -f "$expected" ]; then
  printf 'Missing committed CLI bundle: %s\n' "$expected" >&2
  exit 1
fi

(
  "$repo_root/scripts/build-cli-dist.sh" "$actual_dir"
)

if ! cmp -s "$expected" "$actual"; then
  printf 'Committed CLI bundle is stale: %s\n' "$expected" >&2
  printf 'Run: pnpm --filter @cthutool/cli build\n' >&2
  exit 1
fi

printf 'CLI bundle is current: %s\n' "$expected"
