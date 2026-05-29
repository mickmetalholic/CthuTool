import { text } from '@clack/prompts';
import { createColors } from 'picocolors';
import type { BundledScriptContext } from '../../flow/run-bundled-script';
import { createCliContext } from '../../runtime/cli-context';
import { createCliError } from '../../runtime/cli-error';
import { processOutput, writeJsonValue } from '../../runtime/output';
import { runConversionJob } from './application/run-conversion-job';
import { parseConversionOptions } from './domain/option-schema';
import { epubConverter } from './infrastructure/converters/epub-converter';
import { pdfConverter } from './infrastructure/converters/pdf-converter';
import type { ProgressLogger } from './infrastructure/logging/progress-logger';

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

const silentProgressLogger = (): ProgressLogger => ({
  start: () => undefined,
  beginFile: () => undefined,
  updateFile: () => undefined,
  finishFile: () => undefined,
  info: () => undefined,
  success: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  summary: () => undefined,
  incrementTotal: () => undefined,
  flush: async () => undefined,
  stop: () => undefined,
});

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

const defaultContext = (): BundledScriptContext => ({
  cli: createCliContext({}, { isTty: () => process.stdin.isTTY === true }),
});

const resolveInput = async (
  args: CliArgs,
  context: BundledScriptContext,
): Promise<string | undefined> => {
  if (args.input && args.input.trim().length > 0) {
    return args.input.trim();
  }
  if (!context.cli.interactive) {
    throw createCliError(
      'missing_required_argument',
      'input is required in non-interactive mode (use: --input <dir>)',
    );
  }
  const answer = await text({ message: '请输入待转换目录路径' });
  if (typeof answer !== 'string') return undefined;
  const value = answer.trim();
  return value.length > 0 ? value : undefined;
};

export default async function run(
  args: CliArgs = {},
  context: BundledScriptContext = defaultContext(),
): Promise<void> {
  const input = await resolveInput(args, context);
  if (!input) {
    throw createCliError('missing_required_argument', 'input is required');
  }

  const optionsResult = parseConversionOptions({ ...args, input });
  if (optionsResult.isErr()) {
    throw createCliError('invalid_option', optionsResult.error.message);
  }

  const summary = await runConversionJob(
    optionsResult.value,
    [pdfConverter, epubConverter],
    context.cli.json
      ? { createProgressLogger: silentProgressLogger }
      : undefined,
  );
  if (context.cli.json) {
    writeJsonValue(processOutput, {
      ok: true,
      command: 'scripts',
      script: 'convert-to-cbz',
      summary,
    });
    return;
  }

  process.stdout.write(`${renderCompletionCard(summary)}\n`);
}
