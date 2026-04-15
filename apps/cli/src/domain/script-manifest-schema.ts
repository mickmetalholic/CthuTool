import { err, ok, type Result } from 'neverthrow';
import * as v from 'valibot';

/** Valibot schema for `script.json` (bundled script packages). */
export const scriptManifestSchema = v.object({
  id: v.pipe(v.string(), v.minLength(1)),
  title: v.pipe(v.string(), v.minLength(1)),
  description: v.optional(v.pipe(v.string())),
});

export type ScriptManifest = v.InferOutput<typeof scriptManifestSchema>;

export type ManifestParseError = { readonly message: string };

/**
 * Parses and validates unknown JSON into a {@link ScriptManifest}.
 *
 * @param raw Parsed JSON value for `script.json`
 * @returns Ok manifest or validation error message
 */
export const parseScriptManifest = (
  raw: unknown,
): Result<ScriptManifest, ManifestParseError> => {
  const result = v.safeParse(scriptManifestSchema, raw);
  if (!result.success) {
    const message = result.issues.map((i) => i.message).join('; ');
    return err({ message });
  }
  return ok(result.output);
};
