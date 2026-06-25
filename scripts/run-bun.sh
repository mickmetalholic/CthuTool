#!/usr/bin/env bash
set -euo pipefail

bun_version="${BUN_VERSION:-1.3.11}"

if command -v bun >/dev/null 2>&1 && [ "$(bun --version)" = "$bun_version" ]; then
  exec bun "$@"
fi

if command -v pnpm >/dev/null 2>&1; then
  exec pnpm dlx "bun@$bun_version" "$@"
fi

printf 'Bun %s is required.\n' "$bun_version" >&2
printf 'Install Bun %s or run with pnpm available.\n' "$bun_version" >&2
exit 1
