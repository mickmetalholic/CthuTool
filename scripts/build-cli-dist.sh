#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
outdir="${1:-$repo_root/apps/cli/dist}"
bun_version="${BUN_VERSION:-1.3.11}"

(
  cd "$repo_root/apps/cli"
  BUN_VERSION="$bun_version" "$repo_root/scripts/run-bun.sh" build \
    src/index.ts \
    --outdir "$outdir" \
    --target node \
    --define process.env.NODE_ENV='"production"' \
    >/dev/null
)
