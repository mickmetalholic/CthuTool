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
  readonly overwrite?: boolean;
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

const createDiagnosticsProgressLogger = (
  context: BundledScriptContext,
): ProgressLogger => {
  const emit = (
    level: 'debug' | 'info' | 'warn' | 'error',
    phase: string,
    message: string,
    details?: Record<string, unknown>,
  ) => {
    context.diagnostics?.emit({
      level,
      event: 'cli.script_progress',
      phase,
      scriptId: 'convert-to-cbz',
      message,
      details,
    });
  };
  return {
    start: (totalFiles, fileConcurrency) =>
      emit('info', 'progress', 'conversion started', {
        fileConcurrency,
        totalFiles,
      }),
    beginFile: (taskId, displayName) =>
      emit('debug', 'progress', 'file started', { displayName, taskId }),
    updateFile: (taskId, current, total, message) =>
      emit('debug', 'progress', message ?? 'file progress', {
        current,
        taskId,
        total,
      }),
    finishFile: (taskId, failed) =>
      emit(failed ? 'warn' : 'debug', 'progress', 'file finished', {
        failed: failed === true,
        taskId,
      }),
    info: (message) => emit('info', 'progress', message),
    success: (message) => emit('info', 'progress', message),
    warn: (message) => emit('warn', 'progress', message),
    error: (message) => emit('error', 'progress', message),
    summary: (summary) =>
      emit('info', 'summary', 'conversion summary', {
        failureCount: summary.failureCount,
        convertedCount: summary.convertedCount,
        skippedCount: summary.skippedCount,
        outputRoot: summary.outputRoot,
        successCount: summary.successCount,
        totalFiles: summary.totalFiles,
      }),
    incrementTotal: () => emit('debug', 'progress', 'total incremented'),
    flush: async () => undefined,
    stop: () => undefined,
  };
};

const renderCompletionCard = (input: {
  totalFiles: number;
  successCount: number;
  convertedCount: number;
  skippedCount: number;
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
    `${c.green('│')} ${c.green('📦 Converted')}    ${c.bold(String(input.convertedCount))}`,
    `${c.green('│')} ${c.yellow('⏭ Skipped')}      ${c.bold(String(input.skippedCount))}`,
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
      ? {
          createProgressLogger: () =>
            context.diagnostics?.isEnabled()
              ? createDiagnosticsProgressLogger(context)
              : silentProgressLogger(),
        }
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
