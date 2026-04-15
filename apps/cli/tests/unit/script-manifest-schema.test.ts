import { describe, expect, test } from 'bun:test';
import { parseScriptManifest } from '../../src/domain/script-manifest-schema';

describe('ScriptManifest schema', () => {
  test('accepts minimal valid manifest', () => {
    const result = parseScriptManifest({
      id: 'hello-world',
      title: 'Hello',
    });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.id).toBe('hello-world');
      expect(result.value.title).toBe('Hello');
      expect(result.value.description).toBeUndefined();
    }
  });

  test('accepts manifest with description', () => {
    const result = parseScriptManifest({
      id: 'a-b',
      title: 'T',
      description: 'Longer text',
    });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.description).toBe('Longer text');
    }
  });

  test('rejects non-object root', () => {
    expect(parseScriptManifest(null).isErr()).toBe(true);
    expect(parseScriptManifest('x').isErr()).toBe(true);
  });

  test('rejects missing id or title', () => {
    expect(parseScriptManifest({ title: 'x' }).isErr()).toBe(true);
    expect(parseScriptManifest({ id: 'x' }).isErr()).toBe(true);
  });
});
