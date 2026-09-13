## Context

The cache sync removes the existing plugin cache before copying the repository version. A running Codex process can hold a cache directory open on Windows, causing Node's recursive removal to throw `EBUSY`.

## Decision

- Translate only filesystem `EBUSY` during cache mutation into a dedicated busy error that includes the actual locked path when Node provides one.
- Handle that error at the install command boundary so human output is a plain recovery instruction and JSON output uses a stable error code.
- Leave the process and cache alone after the failure. Retrying after Codex exits completes the normal install flow.

## Scope

No automatic process shutdown, force deletion, or generalized rewriting of permission errors.
