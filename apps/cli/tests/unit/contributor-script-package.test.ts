import { describe, expect, test } from 'bun:test';
import { getBundledScriptsRoot } from '../../src/infra/bundled-scripts-root';
import { discoverScripts } from '../../src/infra/discover-scripts';

describe('contributor script package', () => {
  test('discovers contrib-sample alongside other packages', async () => {
    const root = getBundledScriptsRoot();
    const result = await discoverScripts(root);
    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;
    const ids = result.value.packages.map((p) => p.id).sort();
    expect(ids).toContain('contrib-sample');
  });
});
