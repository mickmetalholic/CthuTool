#!/usr/bin/env bash
set -euo pipefail

repo_url="${CHC_REPO_URL:-${CHC_REPO:-https://github.com/mickmetalholic/CthuTool.git}}"
ref="${CHC_REF:-main}"
install_dir="${CHC_INSTALL_DIR:-$HOME/.cthutool/source/CthuTool}"
install_mode="${CHC_INSTALL_MODE:-auto}"
completion_mode="${CHC_INSTALL_COMPLETION:-auto}"

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

resolve_local_root() {
  local source_path="${BASH_SOURCE[0]:-}"
  if [ -z "$source_path" ] || [ ! -f "$source_path" ]; then
    return 1
  fi

  local script_dir
  script_dir="$(cd -- "$(dirname -- "$source_path")" && pwd)"
  cd -- "$script_dir/.." && pwd
}

case "$install_mode" in
  auto | local | remote) ;;
  *)
    printf 'Invalid CHC_INSTALL_MODE: %s\n' "$install_mode" >&2
    printf 'Expected one of: auto, local, remote\n' >&2
    exit 1
    ;;
esac

case "$completion_mode" in
  auto | none | zsh) ;;
  *)
    printf 'Invalid CHC_INSTALL_COMPLETION: %s\n' "$completion_mode" >&2
    printf 'Expected one of: auto, none, zsh\n' >&2
    exit 1
    ;;
esac

local_root=""
if local_root="$(resolve_local_root)"; then
  has_local_script=true
else
  has_local_script=false
fi

selected_mode="$install_mode"
if [ "$selected_mode" = "auto" ]; then
  if [ "$has_local_script" = true ]; then
    selected_mode="local"
  else
    selected_mode="remote"
  fi
fi

if [ "$selected_mode" = "local" ] && [ "$has_local_script" != true ]; then
  printf 'Local install mode requires running scripts/install-chc.sh from a checkout.\n' >&2
  printf 'Use CHC_INSTALL_MODE=remote for stdin/raw installer usage.\n' >&2
  exit 1
fi

printf 'CthuTool installer\n'
printf 'mode: %s\n' "$selected_mode"

if [ "$selected_mode" = "remote" ]; then
  printf 'repo: %s\n' "$repo_url"
  printf 'ref:  %s\n' "$ref"
  printf 'dir:  %s\n' "$install_dir"

  if git -C "$install_dir" rev-parse --git-dir >/dev/null 2>&1; then
    existing_checkout=true
    if [ -n "$(git -C "$install_dir" status --porcelain --untracked-files=normal)" ]; then
      printf 'Update blocked: the managed checkout has uncommitted or untracked changes.\n' >&2
      printf 'Preserve those changes, then retry.\n' >&2
      exit 1
    fi
    printf '%s\n' '- fetching repository'
    git -C "$install_dir" fetch --no-tags "$repo_url" "$ref"
  else
    existing_checkout=false
    printf '%s\n' '- cloning repository'
    mkdir -p "$(dirname "$install_dir")"
    git clone "$repo_url" "$install_dir"
    git -C "$install_dir" fetch --no-tags "$repo_url" "$ref"
  fi

  target_commit="$(git -C "$install_dir" rev-parse --verify 'FETCH_HEAD^{commit}')"
  if ! git -C "$install_dir" cat-file -e "$target_commit:apps/cli/dist/index.js"; then
    printf 'Missing committed CLI bundle in target %s: apps/cli/dist/index.js\n' "$target_commit" >&2
    exit 1
  fi

  if git ls-remote --exit-code --heads "$repo_url" "$ref" >/dev/null 2>&1; then
    target_kind="branch"
    if [ "$existing_checkout" = true ] && ! git -C "$install_dir" merge-base --is-ancestor HEAD "$target_commit"; then
      printf 'Update blocked: the managed checkout cannot fast-forward to %s.\n' "$ref" >&2
      printf 'Reconcile the local branch manually, then retry.\n' >&2
      exit 1
    fi
  else
    target_kind="detached"
  fi

  if [ "$existing_checkout" = true ]; then
    git -C "$install_dir" remote set-url origin "$repo_url"
    git -C "$install_dir" fetch --tags origin
  fi

  printf '%s\n' '- checking out ref'
  if [ "$target_kind" = "branch" ]; then
    git -C "$install_dir" checkout "$ref"
    printf '%s\n' '- fast-forwarding branch'
    git -C "$install_dir" merge --ff-only "$target_commit"
  else
    git -C "$install_dir" checkout --detach "$target_commit"
  fi

  install_source="$install_dir"
else
  install_source="$local_root"
  printf 'dir:  %s\n' "$install_source"
fi

package_path="$install_source/package.json"
if [ ! -f "$package_path" ]; then
  printf 'Missing root package.json: %s\n' "$package_path" >&2
  exit 1
fi

bundle_path="$install_source/apps/cli/dist/index.js"
if [ ! -f "$bundle_path" ]; then
  printf 'Missing committed CLI bundle: %s\n' "$bundle_path" >&2
  printf 'The selected ref must include apps/cli/dist/index.js.\n' >&2
  exit 1
fi

printf '%s\n' '- installing global command'
npm install -g --ignore-scripts "$install_source"

printf 'Installed: '
command -v chc

selected_completion="$completion_mode"
if [ "$selected_completion" = "auto" ]; then
  login_shell="${SHELL:-}"
  if [ "${login_shell##*/}" = "zsh" ]; then
    selected_completion="zsh"
  else
    selected_completion="none"
  fi
fi

if [ "$selected_completion" = "zsh" ]; then
  printf '%s\n' '- enabling zsh completion'
  if ! chc completion enable zsh; then
    printf '%s\n' 'Warning: installed chc does not support automatic zsh completion setup.' >&2
  fi
fi

printf 'Done. Try: chc --help\n'
