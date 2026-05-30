import { describe, expect, test } from 'bun:test';
import { normalize } from 'node:path';
import { getCodexPluginsRoot } from '../../src/infra/codex-plugins-root';

describe('codex plugins root', () => {
  test('defaults to the repository codex plugins directory', () => {
    const root = normalize(getCodexPluginsRoot());

    expect(root).toContain(normalize('codex/plugins'));
    expect(root).not.toContain(normalize('packages/codex-plugins'));
  });
});
