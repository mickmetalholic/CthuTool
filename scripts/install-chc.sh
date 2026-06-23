#!/usr/bin/env bash
set -euo pipefail

repo_url="${CHC_REPO_URL:-${CHC_REPO:-https://github.com/mickmetalholic/CthuTool.git}}"
ref="${CHC_REF:-main}"
install_dir="${CHC_INSTALL_DIR:-$HOME/.cthutool/source/CthuTool}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Missing required command: %s\n' "$1" >&2
    exit 1
  fi
}

require_command git
require_command node
require_command npm

node -e 'const major = Number(process.versions.node.split(".")[0]); if (major !== 24) { console.error(`Node 24 is required; found ${process.version}`); process.exit(1); }'

printf 'CthuTool installer\n'
printf 'repo: %s\n' "$repo_url"
printf 'ref:  %s\n' "$ref"
printf 'dir:  %s\n' "$install_dir"

if [ -d "$install_dir/.git" ]; then
  printf '%s\n' '- fetching repository'
  git -C "$install_dir" remote set-url origin "$repo_url"
  git -C "$install_dir" fetch --tags origin
else
  printf '%s\n' '- cloning repository'
  mkdir -p "$(dirname "$install_dir")"
  git clone "$repo_url" "$install_dir"
fi

printf '%s\n' '- checking out ref'
git -C "$install_dir" checkout "$ref"

if git -C "$install_dir" rev-parse --verify "origin/$ref" >/dev/null 2>&1; then
  printf '%s\n' '- fast-forwarding branch'
  git -C "$install_dir" pull --ff-only origin "$ref"
fi

bundle_path="$install_dir/apps/cli/dist/index.js"
if [ ! -f "$bundle_path" ]; then
  printf 'Missing committed CLI bundle: %s\n' "$bundle_path" >&2
  printf 'The selected ref must include apps/cli/dist/index.js.\n' >&2
  exit 1
fi

printf '%s\n' '- installing global command'
npm install -g --ignore-scripts "$install_dir"

printf 'Installed: '
command -v chc
printf 'Done. Try: chc --help\n'
