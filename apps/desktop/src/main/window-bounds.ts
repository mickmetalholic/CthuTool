import type { DesktopWindowState } from './config';

export type DesktopWorkArea = {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
};

export type ResolvedDesktopWindowBounds = {
  readonly height: number;
  readonly isMaximized: boolean;
  readonly width: number;
  readonly x: number;
  readonly y: number;
};

const MIN_WIDTH = 860;
const MIN_HEIGHT = 600;
const MAX_INITIAL_WIDTH = 1600;
const MAX_INITIAL_HEIGHT = 1100;
const DISPLAY_MARGIN = 24;

export function resolveDesktopWindowBounds(
  saved: DesktopWindowState | undefined,
  workAreas: readonly DesktopWorkArea[],
): ResolvedDesktopWindowBounds {
  const primary = workAreas[0] ?? {
    height: 760,
    width: 1120,
    x: 0,
    y: 0,
  };

  if (saved) {
    const normalized = normalizeSavedBounds(saved, primary);
    if (isVisibleInAnyWorkArea(normalized, workAreas)) {
      return normalized;
    }

    return centerInWorkArea(normalized, primary);
  }

  return centerInWorkArea(
    {
      height: clampToDisplay(
        Math.round(primary.height * 0.76),
        MIN_HEIGHT,
        Math.min(MAX_INITIAL_HEIGHT, primary.height - DISPLAY_MARGIN * 2),
      ),
      isMaximized: false,
      width: clampToDisplay(
        Math.round(primary.width * 0.72),
        MIN_WIDTH,
        Math.min(MAX_INITIAL_WIDTH, primary.width - DISPLAY_MARGIN * 2),
      ),
      x: primary.x,
      y: primary.y,
    },
    primary,
  );
}

function normalizeSavedBounds(
  saved: DesktopWindowState,
  primary: DesktopWorkArea,
): ResolvedDesktopWindowBounds {
  return {
    height: clampToDisplay(saved.height, MIN_HEIGHT, primary.height - 48),
    isMaximized: saved.isMaximized,
    width: clampToDisplay(saved.width, MIN_WIDTH, primary.width - 48),
    x: saved.x ?? primary.x,
    y: saved.y ?? primary.y,
  };
}

function centerInWorkArea(
  bounds: ResolvedDesktopWindowBounds,
  workArea: DesktopWorkArea,
): ResolvedDesktopWindowBounds {
  const width = clampToDisplay(bounds.width, MIN_WIDTH, workArea.width - 48);
  const height = clampToDisplay(
    bounds.height,
    MIN_HEIGHT,
    workArea.height - 48,
  );

  return {
    ...bounds,
    height,
    width,
    x: Math.round(workArea.x + (workArea.width - width) / 2),
    y: Math.round(workArea.y + (workArea.height - height) / 2),
  };
}

function isVisibleInAnyWorkArea(
  bounds: ResolvedDesktopWindowBounds,
  workAreas: readonly DesktopWorkArea[],
): boolean {
  if (workAreas.length === 0) {
    return true;
  }

  return workAreas.some((workArea) => intersects(bounds, workArea));
}

function intersects(
  bounds: ResolvedDesktopWindowBounds,
  workArea: DesktopWorkArea,
): boolean {
  return (
    bounds.x < workArea.x + workArea.width &&
    bounds.x + bounds.width > workArea.x &&
    bounds.y < workArea.y + workArea.height &&
    bounds.y + bounds.height > workArea.y
  );
}

function clampToDisplay(
  value: number,
  minimum: number,
  maximum: number,
): number {
  const usableMaximum = Math.max(DISPLAY_MARGIN, maximum);
  return Math.max(
    DISPLAY_MARGIN,
    Math.min(Math.max(minimum, value), usableMaximum),
  );
}
