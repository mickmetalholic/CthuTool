import { text } from '@clack/prompts';
import { runConversionJob } from './application/run-conversion-job';
import { parseConversionOptions } from './domain/option-schema';
import { epubConverter } from './infrastructure/converters/epub-converter';
import { pdfConverter } from './infrastructure/converters/pdf-converter';

type CliArgs = {
  readonly input?: string;
  readonly output?: string;
  readonly format?: 'png' | 'jpg' | 'webp';
  readonly quality?: number;
  readonly dpi?: number;
  readonly concurrency?: number;
  readonly epubConcurrency?: number;
};

const resolveInput = async (args: CliArgs): Promise<string | undefined> => {
  if (args.input && args.input.trim().length > 0) {
    return args.input.trim();
  }
  const answer = await text({ message: '请输入待转换目录路径' });
  if (typeof answer !== 'string') return undefined;
  const value = answer.trim();
  return value.length > 0 ? value : undefined;
};

export default async function run(args: CliArgs = {}): Promise<void> {
  const input = await resolveInput(args);
  if (!input) {
    throw new Error('输入路径无效：路径不存在或不是目录');
  }

  const optionsResult = parseConversionOptions({ ...args, input });
  if (optionsResult.isErr()) {
    throw new Error(optionsResult.error.message);
  }

  const summary = await runConversionJob(optionsResult.value, [
    pdfConverter,
    epubConverter,
  ]);
  process.stdout.write(
    `done: total=${summary.totalFiles}, success=${summary.successCount}, failure=${summary.failureCount}\n`,
  );
}
