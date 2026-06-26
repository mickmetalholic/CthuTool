import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const docsRoot = join(__dirname, '..', 'src', 'content', 'docs');
const appRoot = join(__dirname, '..');

function markdownFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return markdownFiles(path);
    }
    return entry.name.endsWith('.md') ? [path] : [];
  });
}

function parseFrontmatter(content: string): Record<string, string> {
  const match = /^---\n(?<frontmatter>[\s\S]*?)\n---/.exec(content);
  if (!match?.groups?.frontmatter) {
    return {};
  }
  return Object.fromEntries(
    match.groups.frontmatter
      .split('\n')
      .map((line) => line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/))
      .filter((line): line is RegExpMatchArray => Boolean(line))
      .map((line) => [line[1], line[2]]),
  );
}

function routeForMarkdown(file: string): string {
  const relativePath = relative(docsRoot, file).split(sep).join('/');
  const withoutExtension = relativePath.replace(/\.md$/, '');
  if (withoutExtension === 'index') {
    return '/';
  }
  if (withoutExtension.endsWith('/index')) {
    return `/${withoutExtension.replace(/\/index$/, '')}/`;
  }
  return `/${withoutExtension}/`;
}

function internalMarkdownLinks(content: string): string[] {
  return Array.from(content.matchAll(/\[[^\]]+]\(([^)]+)\)/g))
    .map((match) => match[1])
    .filter(
      (href) =>
        href.startsWith('/') &&
        !href.startsWith('//') &&
        !href.includes('#') &&
        !href.includes('?'),
    );
}

describe('docs content', () => {
  it('keeps every docs page discoverable through title and description', () => {
    const files = markdownFiles(docsRoot);

    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      const frontmatter = parseFrontmatter(content);

      expect(frontmatter.title, file).toEqual(expect.any(String));
      expect(frontmatter.description, file).toEqual(expect.any(String));
      expect(frontmatter.title.length, file).toBeGreaterThan(0);
      expect(frontmatter.description.length, file).toBeGreaterThan(0);
    }
  });

  it('keeps every docs page reachable through a stable route', () => {
    const routes = markdownFiles(docsRoot).map(routeForMarkdown);

    expect(routes).toContain('/');
    expect(routes).toContain('/applications/');
    expect(routes).toContain('/applications/web/');
    expect(routes).toContain('/repo/overview/');
  });

  it('keeps internal docs links pointed at known routes', () => {
    const files = markdownFiles(docsRoot);
    const routes = new Set(files.map(routeForMarkdown));

    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      for (const href of internalMarkdownLinks(content)) {
        expect(routes.has(href), `${file} links to ${href}`).toBe(true);
      }
    }
  });

  it('does not inspect generated output directories as docs content', () => {
    const files = markdownFiles(docsRoot);
    const relativeFiles = files.map((file) => relative(appRoot, file));

    expect(relativeFiles).not.toContain('coverage/index.html');
    expect(relativeFiles).not.toContain('dist/index.html');
    expect(relativeFiles).not.toContain('.astro/content.d.ts');
    expect(
      relativeFiles.every((file) => file.startsWith('src/content/docs')),
    ).toBe(true);
  });
});
