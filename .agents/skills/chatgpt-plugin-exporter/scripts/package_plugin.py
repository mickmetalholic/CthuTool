#!/usr/bin/env python3
"""Package a reviewed portable web plugin; does not assess skill compatibility."""

import argparse
import hashlib
import json
import re
import stat
import sys
import zipfile
from pathlib import Path


def package(source: Path, destination: Path) -> dict:
    if source.is_symlink():
        raise ValueError("Plugin root must not be a symlink")
    root = source.resolve(strict=True)
    output = destination.resolve()
    if not root.is_dir() or output == root or root in output.parents:
        raise ValueError("Use a plugin directory and an archive outside it")
    if output.suffix != ".zip":
        raise ValueError("Archive destination must end in .zip")

    files = []
    for path in sorted(root.rglob("*")):
        relative = path.relative_to(root)
        mode = path.lstat().st_mode
        if stat.S_ISLNK(mode) or not (stat.S_ISDIR(mode) or stat.S_ISREG(mode)):
            raise ValueError(f"Unsupported linked or special entry: {relative}")
        if any(part in {".git", "node_modules", "__pycache__", ".venv"}
               or part == ".env" or part.startswith(".env.") for part in relative.parts):
            raise ValueError(f"Exclude local/dependency artifact: {relative}")
        if relative.parts[0] in {".codex-plugin", ".mcp.json", "hooks"}:
            raise ValueError(f"Remove local/legacy plugin declaration: {relative}")
        if stat.S_ISREG(mode):
            files.append(path)

    manifest = json.loads((root / "plugin.json").read_text(encoding="utf-8"))
    if not isinstance(manifest, dict) or manifest.get("$schema") != (
        "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"
    ):
        raise ValueError("Expected a portable root plugin.json with its schema")
    name = manifest.get("name", "")
    if not isinstance(name, str) or len(name) > 64 or not re.fullmatch(
        r"[a-z0-9]+(?:-[a-z0-9]+)*", name
    ):
        raise ValueError("Use a lowercase kebab-case plugin name, at most 64 characters")
    if root.name != name:
        raise ValueError("Plugin directory name must match manifest name")
    forbidden = {"skills", "mcpServers", "apps", "interface"} & manifest.keys()
    if forbidden:
        raise ValueError(f"Legacy top-level fields in portable manifest: {sorted(forbidden)}")
    skills = [str(p.relative_to(root).parent) for p in files
              if p.name == "SKILL.md" and len(p.relative_to(root).parts) == 3
              and p.relative_to(root).parts[0] == "skills"
              and not p.relative_to(root).parts[1].startswith(".")]
    if not skills:
        raise ValueError("Expected at least one reviewed skills/<name>/SKILL.md")

    # Exclusive creation prevents accidentally replacing a previously uploaded archive.
    with zipfile.ZipFile(output, "x", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in files:
            archive.write(path, (Path(name) / path.relative_to(root)).as_posix())
    with zipfile.ZipFile(output) as archive:
        bad_file = archive.testzip()
        if bad_file:
            raise ValueError(f"Archive failed integrity check: {bad_file}")
        members = archive.namelist()
    return {
        "archive": str(output),
        "sha256": hashlib.sha256(output.read_bytes()).hexdigest(),
        "plugin_name": name,
        "skills": skills,
        "files": members,
        "note": "Archive checks passed; schema and Chat runtime review are separate.",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("plugin_directory", type=Path)
    parser.add_argument("archive", type=Path)
    args = parser.parse_args()
    try:
        result = package(args.plugin_directory, args.archive)
    except (OSError, ValueError, zipfile.BadZipFile) as error:
        print(f"Packaging failed: {error}", file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
