import { text } from '@clack/prompts';
import { createColors } from 'picocolors';
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

const c = createColors(true);

const renderCompletionCard = (input: {
  totalFiles: number;
  successCount: number;
  failureCount: number;
  outputRoot: string;
  durationMs: number;
}): string => {
  const durationSec = Math.max(0, Math.round(input.durationMs / 1000));
  const lines = [
    c.bold(c.green('╭─ ✅ Conversion Complete')),
    `${c.green('│')} ${c.dim('────────────────────────────────────────')}`,
    `${c.green('│')} ${c.cyan('📚 Total Files')}  ${c.bold(String(input.totalFiles))}`,
    `${c.green('│')} ${c.green('✅ Success')}      ${c.bold(String(input.successCount))}`,
    `${c.green('│')} ${input.failureCount > 0 ? c.red('❌ Failure') : c.green('❌ Failure')}      ${c.bold(String(input.failureCount))}`,
    `${c.green('│')} ${c.blue('📂 Output')}       ${c.bold(input.outputRoot)}`,
    `${c.green('│')} ${c.yellow('⏱ Duration')}    ${c.bold(`${durationSec}s`)}`,
    c.bold(c.green('╰─ ready for next batch')),
  ];
  return lines.join('\n');
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
  process.stdout.write(`${renderCompletionCard(summary)}\n`);
}
