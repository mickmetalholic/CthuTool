import { err, ok, type Result } from 'neverthrow';
import * as v from 'valibot';
import type { ConversionOptions } from './conversion-types';

const optionSchema = v.object({
  input: v.pipe(v.string(), v.minLength(1)),
  output: v.optional(v.pipe(v.string(), v.minLength(1))),
  overwrite: v.optional(v.boolean()),
  format: v.optional(v.picklist(['png', 'jpg', 'webp'])),
  quality: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100))),
  dpi: v.optional(v.pipe(v.number(), v.minValue(72), v.maxValue(600))),
  concurrency: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(16))),
  epubConcurrency: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(2))),
});

type RawOptions = v.InferOutput<typeof optionSchema>;

export type OptionParseError = { readonly message: string };

export const defaultConversionOptions = (
  partial: RawOptions,
): ConversionOptions => ({
  input: partial.input,
  output: partial.output,
  overwrite: partial.overwrite ?? false,
  imageFormat: partial.format ?? 'jpg',
  imageQuality: partial.quality ?? 90,
  dpi: partial.dpi ?? 200,
  fileConcurrency: partial.concurrency ?? Math.min(4, navigatorCpuCount()),
  epubRenderConcurrency: partial.epubConcurrency ?? 1,
});

export const parseConversionOptions = (
  raw: unknown,
): Result<ConversionOptions, OptionParseError> => {
  const parsed = v.safeParse(optionSchema, raw);
  if (!parsed.success) {
    return err({ message: parsed.issues.map((x) => x.message).join('; ') });
  }
  return ok(defaultConversionOptions(parsed.output));
};

const navigatorCpuCount = (): number => {
  const count = Number(process.env.NUMBER_OF_PROCESSORS ?? 0);
  return count > 0 ? count : 4;
};
