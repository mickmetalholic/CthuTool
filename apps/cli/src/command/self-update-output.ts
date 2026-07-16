import { spinner } from '@clack/prompts';
import pc from 'picocolors';
import type {
  SelfUpdateError,
  SelfUpdateEvent,
  SelfUpdatePhase,
  SelfUpdatePlan,
  SelfUpdateResult,
} from '../domain/self-update-manager';
import type { CliContext } from '../runtime/cli-context';
import { type CliOutput, processOutput } from '../runtime/output';

type SpinnerLike = ReturnType<typeof spinner>;

export type SelfUpdateRenderer = {
  readonly onEvent: (event: SelfUpdateEvent) => void;
  readonly renderCheckResult: (plan: SelfUpdatePlan) => void;
  readonly renderApplyResult: (result: SelfUpdateResult) => void;
  readonly stopForError: (error: unknown) => void;
};

export type SelfUpdateRendererDeps = {
  readonly output: CliOutput;
  readonly isOutputTty: () => boolean;
  readonly createSpinner: () => SpinnerLike;
};

const defaultDeps: SelfUpdateRendererDeps = {
  output: processOutput,
  isOutputTty: () => process.stdout.isTTY === true,
  createSpinner: spinner,
};

const phaseLabels: Record<SelfUpdatePhase, string> = {
  preflight: 'Checking local update state',
  check_remote: 'Checking the selected remote ref',
  clone: 'Cloning the managed source checkout',
  fetch: 'Fetching repository updates',
  checkout: 'Checking out the selected ref',
  verify_bundle: 'Verifying the committed CLI bundle',
  install_global: 'Installing the global command',
};

function identity(value: {
  readonly ref: string;
  readonly shortCommit: string;
}) {
  return `${value.ref}@${value.shortCommit}`;
}

export function createSelfUpdateRenderer(
  context: CliContext,
  options: { readonly verbose: boolean },
  deps: SelfUpdateRendererDeps = defaultDeps,
): SelfUpdateRenderer {
  const human = !context.json && !context.quiet;
  const interactiveOutput = human && context.isTty && deps.isOutputTty();
  const colors = pc.createColors(interactiveOutput);
  let activeSpinner: SpinnerLike | undefined;
  let activePhase: SelfUpdatePhase | undefined;
  let headerWritten = false;

  const writeHeader = () => {
    if (!human || headerWritten) return;
    headerWritten = true;
    deps.output.stdout.write(`${colors.cyan('CthuTool update')}\n`);
  };

  const stopSpinner = (message: string, code?: number) => {
    if (!activeSpinner) return;
    activeSpinner.stop(message, code);
    activeSpinner = undefined;
    activePhase = undefined;
  };

  const renderPlan = (plan: SelfUpdatePlan) => {
    if (!human) return;
    writeHeader();
    deps.output.stdout.write(`source: ${plan.installDir}\n`);
    deps.output.stdout.write(`target: ${plan.repo}#${plan.ref}\n`);
    if (plan.before) {
      deps.output.stdout.write(`current: ${identity(plan.before)}\n`);
    }
    if (plan.target) {
      deps.output.stdout.write(`latest:  ${identity(plan.target)}\n`);
    }
    if (plan.changes && plan.changes.count > 0) {
      deps.output.stdout.write(`changes: ${plan.changes.count} commit(s)\n`);
      for (const change of plan.changes.highlights) {
        deps.output.stdout.write(`  ${change.commit}  ${change.subject}\n`);
      }
      if (plan.changes.omitted > 0) {
        deps.output.stdout.write(
          `  … ${plan.changes.omitted} more commit(s)\n`,
        );
      }
    }
  };

  const renderVerboseCommand = (
    event: Extract<SelfUpdateEvent, { readonly type: 'command' }>,
  ) => {
    if (!options.verbose) return;
    const cwd = event.cwd ? ` (cwd: ${event.cwd})` : '';
    deps.output.stderr.write(
      `${colors.dim(`$ ${event.command} ${event.args.join(' ')}${cwd}`)}\n`,
    );
    for (const detail of [event.stderr, event.stdout]) {
      if (detail) deps.output.stderr.write(`${colors.dim(detail)}\n`);
    }
  };

  return {
    onEvent(event) {
      if (event.type === 'command') {
        renderVerboseCommand(event);
        return;
      }
      if (event.type === 'plan') {
        renderPlan(event.plan);
        return;
      }
      if (event.type === 'failure') {
        if (activeSpinner) {
          stopSpinner(`${phaseLabels[event.phase]} failed`, 1);
        }
        return;
      }
      if (!human) return;
      writeHeader();
      const label = phaseLabels[event.phase];
      if (event.type === 'phase_started') {
        if (interactiveOutput) {
          if (activeSpinner)
            stopSpinner(phaseLabels[activePhase ?? event.phase]);
          activeSpinner = deps.createSpinner();
          activePhase = event.phase;
          activeSpinner.start(label);
        } else {
          deps.output.stdout.write(`- ${label}\n`);
        }
        return;
      }
      if (interactiveOutput) {
        stopSpinner(`${label} complete`);
      } else {
        deps.output.stdout.write(`${colors.green('✓')} ${label}\n`);
      }
    },
    renderCheckResult(plan) {
      if (!human) return;
      if (plan.status === 'up_to_date' && plan.relinkRequired && plan.target) {
        deps.output.stdout.write(
          `${colors.yellow('Global relink required')} · run chc update · ${identity(plan.target)}\n`,
        );
      } else if (plan.status === 'up_to_date' && plan.target) {
        deps.output.stdout.write(
          `${colors.green('✓')} chc is already up to date · ${identity(plan.target)}\n`,
        );
      } else if (plan.status === 'update_available' && plan.target) {
        deps.output.stdout.write(
          `${colors.cyan('Update available')} · ${identity(plan.target)}\n`,
        );
      } else if (plan.status === 'install_required') {
        deps.output.stdout.write(
          `${colors.yellow('Managed installation required')} · run chc update\n`,
        );
      }
    },
    renderApplyResult(result) {
      if (!human) return;
      const after = result.after ?? result.target;
      if (result.status === 'up_to_date' && after) {
        deps.output.stdout.write(
          `${colors.green('✓')} chc is already up to date · ${identity(after)}\n`,
        );
        return;
      }
      const before = result.before ? `${identity(result.before)} → ` : '';
      const target = after ? identity(after) : result.ref;
      const verb = result.status === 'installed' ? 'Installed' : 'Updated';
      deps.output.stdout.write(
        `${colors.green('✓')} ${verb} chc successfully · ${before}${target}\n`,
      );
      deps.output.stdout.write(
        '  Run `chc status` for installation details.\n',
      );
    },
    stopForError(error) {
      if (!activeSpinner) return;
      const phase =
        error && typeof error === 'object' && 'phase' in error
          ? (error as SelfUpdateError).phase
          : activePhase;
      stopSpinner(phase ? `${phaseLabels[phase]} failed` : 'Update failed', 1);
    },
  };
}
