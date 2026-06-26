import { beforeEach, describe, expect, it, vi } from 'vitest';

const defineCollection = vi.fn((config: unknown) => ({
  config,
  kind: 'collection',
}));
const docsLoader = vi.fn(() => ({ kind: 'docs-loader' }));
const docsSchema = vi.fn(() => ({ kind: 'docs-schema' }));

vi.mock('astro:content', () => ({ defineCollection }));
vi.mock('@astrojs/starlight/loaders', () => ({ docsLoader }));
vi.mock('@astrojs/starlight/schema', () => ({ docsSchema }));

describe('docs content config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers the Starlight docs collection', async () => {
    const { collections } = await import('../src/content.config');

    expect(Object.keys(collections)).toEqual(['docs']);
    expect(docsLoader).toHaveBeenCalledOnce();
    expect(docsSchema).toHaveBeenCalledOnce();
    expect(defineCollection).toHaveBeenCalledWith({
      loader: { kind: 'docs-loader' },
      schema: { kind: 'docs-schema' },
    });
    expect(collections.docs).toEqual({
      config: {
        loader: { kind: 'docs-loader' },
        schema: { kind: 'docs-schema' },
      },
      kind: 'collection',
    });
  });
});
