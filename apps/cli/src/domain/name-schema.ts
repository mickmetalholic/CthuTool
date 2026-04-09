import { err, ok, type Result } from 'neverthrow';
import * as v from 'valibot';

export const nameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, 'name cannot be empty'),
);

export type NameValidationError = { readonly message: string };

export const normalizeName = (raw: string): string => raw.trim();

export const validateName = (
  raw: string,
): Result<string, NameValidationError> => {
  const normalized = normalizeName(raw);
  const result = v.safeParse(nameSchema, normalized);
  if (!result.success) {
    return err({ message: '姓名不能为空' });
  }
  return ok(result.output);
};
