#!/usr/bin/env bash
# Standalone onboarding. Download this script over HTTPS, then run it as your user.
set -euo pipefail
repo='git@github.com:mickmetalholic/CthuTool.git'
destination="$HOME/Documents/GitHub/CthuTool"
interactive=true
configure_remote=false
host=''
while [ "$#" -gt 0 ]; do
  case "$1" in
    --dir) destination="${2:?--dir requires a path}"; shift 2 ;;
    --host) host="${2:?--host requires a canonical ID}"; shift 2 ;;
    --no-interactive) interactive=false; shift ;;
    --configure-ssh-remote) configure_remote=true; shift ;;
    --help) printf '%s\n' 'bootstrap.sh [--dir PATH] [--host ID] [--no-interactive] [--configure-ssh-remote]'; exit 0 ;;
    *) printf 'Unknown argument: %s\n' "$1" >&2; exit 1 ;;
  esac
done
[ -t 0 ] || interactive=false
stage='prerequisites'
fail() { printf '%s\n' "$*" >&2; exit 1; }
trap 'printf "Bootstrap incomplete at %s. Completed prerequisites and checkout are preserved. Rerun this script; after installation resume with chc dotfiles notion auth, then chc dotfiles init --host <id>; resolve reported files with chc dotfiles config add <paths>.\n" "$stage" >&2' ERR
[ "$(id -u)" != 0 ] || fail 'Run bootstrap as your regular user. System prerequisites use sudo individually; do not run the entire script with sudo.'
case "$(uname -s)" in Darwin) os=darwin ;; Linux) os=linux ;; *) fail 'Supported systems: macOS/Linux; use bootstrap.ps1 on Windows.' ;; esac
case "$(uname -m)" in x86_64|amd64) arch=x64 ;; arm64|aarch64) arch=arm64 ;; *) fail 'Unsupported architecture: x64 and arm64 only.' ;; esac
if [ "$os" = linux ]; then
  if command -v ldd >/dev/null 2>&1 && ldd --version 2>&1 | head -n 1 | grep -qi musl; then fail 'Official Node bootstrap requires glibc; install Node 24/npm for your libc first.'; fi
fi
if ! command -v git >/dev/null 2>&1 || ! command -v ssh >/dev/null 2>&1; then
  if [ "$os" = darwin ]; then
    xcode-select --install || true
    fail 'Complete Apple Command Line Tools installation, then rerun bootstrap.'
  elif command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update
    sudo apt-get install -y git openssh-client ca-certificates curl xz-utils
  elif command -v dnf >/dev/null 2>&1; then
    sudo dnf install -y git openssh-clients ca-certificates curl xz
  else fail 'Install Git, OpenSSH and an HTTPS downloader with your OS package manager, then rerun.'; fi
fi
command -v git >/dev/null && command -v ssh >/dev/null || fail 'Git/OpenSSH preparation did not complete.'
download() { if command -v curl >/dev/null 2>&1; then curl --fail --location --silent --show-error --connect-timeout 20 --max-time 300 "$1" -o "$2"; elif command -v wget >/dev/null 2>&1; then wget -q "$1" -O "$2"; else fail 'Install curl or wget, then rerun.'; fi; }
node_path=''
if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1 && node -e 'process.exit(process.versions.node.split(".")[0] === "24" ? 0 : 1)' && npm --version >/dev/null; then
  node_path="$(node -p 'process.execPath')"
else
  temporary="$(mktemp -d)"
  table="$temporary/node.tsv"
  script_dir=''
  if [ -n "${BASH_SOURCE[0]:-}" ] && [ -f "${BASH_SOURCE[0]}" ]; then script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"; fi
  if [ -n "$script_dir" ] && [ -f "$script_dir/bootstrap-node-runtime.tsv" ]; then cp "$script_dir/bootstrap-node-runtime.tsv" "$table"; else download 'https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/bootstrap-node-runtime.tsv' "$table"; fi
  row="$(awk -F '\t' -v target="$os-$arch" '$2==target {print; exit}' "$table")"
  [ -n "$row" ] || fail "No pinned Node archive for $os-$arch"
  IFS=$'\t' read -r version target url checksum <<< "$row"
  case "$version" in 24.*) ;; *) fail 'Invalid Node lock version' ;; esac
  case "$url" in https://nodejs.org/dist/v24.*) ;; *) fail 'Unexpected Node archive URL' ;; esac
  runtime="$HOME/.cthutool/runtime/node/$version/$target"
  [ ! -L "$HOME/.cthutool" ] && [ ! -L "$runtime" ] || fail 'Refusing linked runtime directory.'
  if [ -e "$runtime" ]; then
    [ -x "$runtime/bin/node" ] && [ -f "$runtime/lib/node_modules/npm/bin/npm-cli.js" ] || fail 'Existing runtime is incomplete; inspect it before retrying.'
    "$runtime/bin/node" -e 'process.exit(process.versions.node.split(".")[0]==="24"?0:1)' || fail 'Existing runtime directory is incompatible; inspect before retrying.'
  else
    archive="$temporary/${url##*/}"
    download "$url" "$archive"
    if command -v sha256sum >/dev/null 2>&1; then actual="$(sha256sum "$archive" | cut -d ' ' -f 1)"; else actual="$(shasum -a 256 "$archive" | cut -d ' ' -f 1)"; fi
    [ "$actual" = "$checksum" ] || fail 'Node checksum mismatch; no runtime was installed.'
    mkdir -p "$(dirname "$runtime")"
    extracted="$temporary/node-v$version-$target"
    tar -xf "$archive" -C "$temporary"
    [ -x "$extracted/bin/node" ] && [ -f "$extracted/lib/node_modules/npm/bin/npm-cli.js" ] || fail 'Complete Node/npm archive required.'
    mv "$extracted" "$runtime"
  fi
  node_path="$runtime/bin/node"
  rm -rf "$temporary"
fi
node_bin="$(dirname "$node_path")"
export PATH="$node_bin:$PATH"
command -v npm >/dev/null && npm --version >/dev/null || fail 'Node 24 is available but npm is missing.'
[ "$interactive" = true ] || [ -n "$host" ] || fail 'Noninteractive bootstrap requires --host <published-id>.'
stage='GitHub SSH'
ssh_ready() {
  local answer code
  set +e
  if [ "$interactive" = true ]; then answer="$(ssh -T git@github.com 2>&1)"; code=$?; else answer="$(ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -T git@github.com 2>&1)"; code=$?; fi
  set -e
  # GitHub deliberately exits 1 after successful authentication without shell access.
  [[ "$answer" == *'successfully authenticated'* ]] && [ "$code" -le 1 ]
}
if ! ssh_ready; then
  [ "$interactive" = true ] || fail 'GitHub SSH is unavailable. Configure a trusted host key and register your public key, then rerun. No HTTPS clone was attempted.'
  mkdir -p "$HOME/.ssh"
  chmod 700 "$HOME/.ssh"
  keys=()
  for public in "$HOME"/.ssh/*.pub; do [ ! -f "$public" ] || keys+=("${public%.pub}"); done
  printf 'Choose an existing SSH key or generate a new key:\n'
  for i in "${!keys[@]}"; do printf '%s) %s\n' "$((i+1))" "${keys[$i]}"; done
  printf '0) Generate ~/.ssh/id_ed25519_cthutool (never overwrite an existing key)\n'
  read -r -p 'Key number: ' selection
  if [ "$selection" = 0 ]; then
    selected="$HOME/.ssh/id_ed25519_cthutool"
    [ ! -e "$selected" ] && [ ! -e "$selected.pub" ] || fail 'Key path already exists; rerun and choose it.'
    ssh-keygen -t ed25519 -f "$selected" -C 'CthuTool bootstrap'
  elif [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -ge 1 ] && [ "$selection" -le "${#keys[@]}" ]; then selected="${keys[$((selection-1))]}"; else fail 'Invalid key selection.'; fi
  if [ -z "${SSH_AUTH_SOCK:-}" ]; then eval "$(ssh-agent -s)"; fi
  ssh-add "$selected"
  [ ! -L "$HOME/.ssh/config" ] || fail 'SSH config is linked. Add the selected IdentityFile for github.com to that config, then rerun.'
  if [ ! -f "$HOME/.ssh/config" ] || ! grep -Fq "IdentityFile \"$selected\"" "$HOME/.ssh/config"; then
    printf '\n# CthuTool selected GitHub identity\nHost github.com\n  IdentityFile "%s"\n  AddKeysToAgent yes\n' "$selected" >> "$HOME/.ssh/config"
    chmod 600 "$HOME/.ssh/config"
  fi

  printf '\nRegister this public key at https://github.com/settings/ssh/new:\n'
  cat "$selected.pub"
  read -r -p 'Press Enter after registration to retry SSH: ' _answer
  ssh_ready || fail 'GitHub SSH authentication failed; key files were preserved.'
fi
if [ "$interactive" = true ]; then git ls-remote "$repo" HEAD >/dev/null; else GIT_SSH_COMMAND='ssh -o BatchMode=yes -o StrictHostKeyChecking=yes' git ls-remote "$repo" HEAD >/dev/null; fi
[ "$interactive" = true ] || export GIT_SSH_COMMAND='ssh -o BatchMode=yes -o StrictHostKeyChecking=yes'
stage='SSH checkout'
case "$destination" in '~/'*) destination="$HOME/${destination#\~/}" ;; esac
if [ -e "$destination" ]; then
  [ -d "$destination" ] || fail 'Destination is occupied by a file.'
  root="$(git -C "$destination" rev-parse --show-toplevel 2>/dev/null)" || fail 'Destination contains unrelated files; use --dir.'
  [ "$(cd "$destination" && pwd -P)" = "$(cd "$root" && pwd -P)" ] || fail 'Destination is inside another repository; use --dir.'
  origin="$(git -C "$destination" remote get-url origin)"
  if [ "$origin" = 'https://github.com/mickmetalholic/CthuTool.git' ] || [ "$origin" = 'https://github.com/mickmetalholic/CthuTool' ]; then
    [ "$configure_remote" = true ] || fail 'Existing origin is HTTPS. Rerun with --configure-ssh-remote to explicitly change it.'
    git -C "$destination" remote set-url origin "$repo"
  elif [ "$origin" != "$repo" ] && [ "$origin" != 'ssh://git@github.com/mickmetalholic/CthuTool.git' ]; then fail 'Destination is a different repository; use --dir.'; fi
  printf 'Reusing checkout; local changes preserved, no fetch/reset/pull.\n'
else
  mkdir -p "$(dirname "$destination")"
  git clone "$repo" "$destination"
fi
stage='CLI installation'
for protected_path in "$HOME/.cthutool" "$HOME/.cthutool/npm" "$HOME/.cthutool/bin"; do [ ! -L "$protected_path" ] || fail "Refusing linked bootstrap storage: $protected_path"; done
[ -f "$destination/apps/cli/dist/index.js" ] || fail 'Selected checkout lacks the committed CLI bundle.'
export npm_config_prefix="$HOME/.cthutool/npm"
export PATH="$node_bin:$npm_config_prefix/bin:$PATH"
export CHC_INSTALL_MODE=local
export CHC_INSTALL_COMPLETION=none
bash "$destination/scripts/install-chc.sh"
launcher_dir="$HOME/.cthutool/bin"
mkdir -p "$launcher_dir"
launcher="$launcher_dir/chc"
if [ -e "$launcher" ] && ! grep -q '^# CthuTool bootstrap launcher$' "$launcher"; then fail "Unmanaged launcher exists: $launcher"; fi
# %q preserves spaces and shell metacharacters in user paths.
{
  printf '#!/usr/bin/env bash\n# CthuTool bootstrap launcher\n'
  printf 'export PATH=%q:"$PATH"\n' "$node_bin:$launcher_dir:$HOME/.local/bin"
  printf 'export npm_config_prefix=%q\n' "$npm_config_prefix"
  printf 'exec %q %q "$@"\n' "$node_path" "$npm_config_prefix/lib/node_modules/cthutool/apps/cli/bin/chc.mjs"
} > "$launcher.tmp"
chmod 755 "$launcher.tmp"
mv "$launcher.tmp" "$launcher"
export PATH="$launcher_dir:$PATH"
for profile in "$HOME/.profile" "$HOME/.zshrc" "$HOME/.bashrc"; do
  [ ! -L "$profile" ] || fail "Profile is a symlink; add $launcher_dir to PATH manually, then rerun."
  if [ ! -f "$profile" ] || ! grep -q '^# >>> cthutool bootstrap PATH >>>$' "$profile"; then
    printf '\n# >>> cthutool bootstrap PATH >>>\nexport PATH="$HOME/.cthutool/bin:$HOME/.local/bin:$PATH"\n# <<< cthutool bootstrap PATH <<<\n' >> "$profile"
  fi
done
chc source status --no-interactive
stage='Notion authentication'
if [ "$interactive" = true ]; then chc dotfiles notion auth --source "$destination"; else chc dotfiles notion auth --source "$destination" --no-interactive; fi
stage='host binding and file review'
init_flags=(--source "$destination")
[ "$interactive" = true ] || init_flags+=(--no-interactive)
[ -z "$host" ] || init_flags+=(--host "$host")
chc dotfiles init "${init_flags[@]}"
printf '\nBootstrap complete. Open a new terminal. Review explicit next steps:\n  chc dotfiles env setup --dry-run\n  chc dotfiles env setup\n  chc dotfiles config add <pending-paths>  # when init reported pending files\n  chc dotfiles config diff\n  chc dotfiles config apply\n  mise install\n'
