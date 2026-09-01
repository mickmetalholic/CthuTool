import { isAbsolute, relative, resolve, sep } from 'node:path';
import {
  type CliSourceCandidate,
  getCliManagedSourceState,
} from '../domain/cli-source-manager';

export type CliSourcePresentationState =
  | 'active'
  | 'ready'
  | 'not installed'
  | 'unavailable';

export type CliSourceCandidatePresentation = {
  readonly selector: string;
  readonly kind: string;
  readonly ref?: string;
  readonly state: CliSourcePresentationState;
  readonly displayPath: string;
  readonly hint?: string;
  readonly actionable: boolean;
};

export function presentCliSourceCandidate(
  candidate: CliSourceCandidate,
  home: string,
): CliSourceCandidatePresentation {
  const managedState = getCliManagedSourceState(candidate);
  const state: CliSourcePresentationState = candidate.active
    ? 'active'
    : managedState === 'absent'
      ? 'not installed'
      : candidate.available
        ? 'ready'
        : 'unavailable';

  return {
    selector: candidate.id,
    kind: candidate.kind,
    ref: candidate.branch
      ? `branch ${candidate.branch}`
      : candidate.detached
        ? 'detached'
        : undefined,
    state,
    displayPath: abbreviateHomePath(candidate.path, home),
    hint:
      managedState === 'absent'
        ? 'Selecting remote will install and switch to it.'
        : state === 'unavailable' && candidate.kind === 'managed'
          ? 'Repair or move the existing managed path before selecting remote.'
          : state === 'unavailable'
            ? 'Refresh apps/cli/dist/index.js or select another checkout.'
            : undefined,
    actionable: candidate.available || managedState === 'absent',
  };
}

export function sourcePresentationDescription(
  presentation: CliSourceCandidatePresentation,
): string {
  return [presentation.kind, presentation.ref, presentation.state]
    .filter(Boolean)
    .join(' · ');
}

export function sourceChoiceLabel(
  candidate: CliSourceCandidate,
  home: string,
): string {
  const presentation = presentCliSourceCandidate(candidate, home);
  return [
    `${presentation.selector} — ${sourcePresentationDescription(presentation)}`,
    presentation.hint,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function actionableCliSourceCandidates(
  candidates: readonly CliSourceCandidate[],
  home: string,
): readonly CliSourceCandidate[] {
  return candidates.filter(
    (candidate) => presentCliSourceCandidate(candidate, home).actionable,
  );
}

export function abbreviateHomePath(path: string, home: string): string {
  const resolvedHome = resolve(home);
  const resolvedPath = resolve(path);
  const relativePath = relative(resolvedHome, resolvedPath);
  if (relativePath === '') return '~';
  if (relativePath.startsWith(`..${sep}`) || relativePath === '..') return path;
  if (isAbsolute(relativePath)) return path;
  return `~${sep}${relativePath}`;
}
