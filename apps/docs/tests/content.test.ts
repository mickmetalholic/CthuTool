import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const docsRoot = join(__dirname, '..', 'src', 'content', 'docs');

function markdownFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return markdownFiles(path);
    }
    return entry.name.endsWith('.md') ? [path] : [];
  });
}

describe('docs content', () => {
  it('keeps every docs page discoverable through title and description', () => {
    const files = markdownFiles(docsRoot);

    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const content = readFileSync(file, 'utf8');

      expect(content).toMatch(/^---\ntitle: .+\ndescription: .+\n---/);
    }
  });
});
