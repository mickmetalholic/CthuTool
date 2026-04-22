import type { FailureRecord, FailureStage } from './conversion-types';

const createFailure = (
  sourcePath: string,
  stage: FailureStage,
  reason: string,
  recoverable: boolean,
): FailureRecord => ({
  sourcePath,
  stage,
  reason,
  recoverable,
});

export const dependencyMissing = (reason: string): Error =>
  new Error(`Poppler dependency check failed: ${reason}`);

export const permissionFailure = (
  sourcePath: string,
  stage: FailureStage,
): FailureRecord =>
  createFailure(
    sourcePath,
    stage,
    'Permission denied. Please check read/write permission and try again.',
    true,
  );

export const conversionFailure = (
  sourcePath: string,
  stage: FailureStage,
  reason: string,
): FailureRecord => createFailure(sourcePath, stage, reason, true);

export const fatalFailure = (
  sourcePath: string,
  stage: FailureStage,
  reason: string,
): FailureRecord => createFailure(sourcePath, stage, reason, false);
