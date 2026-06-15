import { describe, expect, test } from 'vitest';
import { resolveDesktopWindowBounds } from '../../src/main/window-bounds';

const primaryWorkArea = {
  x: 100,
  y: 50,
  width: 3840,
  height: 2160,
};

describe('desktop window bounds', () => {
  test('derives first-launch bounds from the primary display work area', () => {
    expect(resolveDesktopWindowBounds(undefined, [primaryWorkArea])).toEqual({
      height: 1100,
      isMaximized: false,
      width: 1600,
      x: 1220,
      y: 580,
    });
  });

  test('restores a saved visible window size and position exactly', () => {
    expect(
      resolveDesktopWindowBounds(
        {
          height: 760,
          isMaximized: true,
          width: 1120,
          x: -1200,
          y: 80,
        },
        [primaryWorkArea, { x: -1920, y: 0, width: 1920, height: 1080 }],
      ),
    ).toEqual({
      height: 760,
      isMaximized: true,
      width: 1120,
      x: -1200,
      y: 80,
    });
  });

  test('recovers an off-screen saved window by centering its size on the primary display', () => {
    expect(
      resolveDesktopWindowBounds(
        {
          height: 900,
          isMaximized: false,
          width: 1400,
          x: 9000,
          y: 9000,
        },
        [primaryWorkArea],
      ),
    ).toEqual({
      height: 900,
      isMaximized: false,
      width: 1400,
      x: 1320,
      y: 680,
    });
  });

  test('keeps recovered bounds inside a smaller primary work area when possible', () => {
    expect(
      resolveDesktopWindowBounds(
        {
          height: 1200,
          isMaximized: false,
          width: 2000,
          x: -9000,
          y: -9000,
        },
        [{ x: 0, y: 0, width: 1280, height: 720 }],
      ),
    ).toEqual({
      height: 672,
      isMaximized: false,
      width: 1232,
      x: 24,
      y: 24,
    });
  });
});
