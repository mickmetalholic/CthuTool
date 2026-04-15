import { err, ok, type Result } from 'neverthrow';

const KEBAB_CASE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type ScriptIdValidationError = { readonly message: string };

/** Trims surrounding whitespace; does not validate shape. */
export const normalizeScriptId = (raw: string): string => raw.trim();

/**
 * Validates a script folder id: non-empty kebab-case (lowercase, digits, hyphens).
 *
 * @param raw Candidate id string (often a directory name)
 * @returns Ok trimmed id or validation error
 */
export const validateScriptId = (
  raw: string,
): Result<string, ScriptIdValidationError> => {
  const id = normalizeScriptId(raw);
  if (id.length === 0) {
    return err({ message: 'script id cannot be empty' });
  }
  if (!KEBAB_CASE_RE.test(id)) {
    return err({
      message:
        'script id must be kebab-case (lowercase letters, digits, single hyphens between segments)',
    });
  }
  return ok(id);
};
