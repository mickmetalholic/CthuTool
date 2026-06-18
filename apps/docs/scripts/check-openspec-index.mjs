import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const docsRoot = process.cwd();
const repoRoot = path.resolve(docsRoot, '../..');
const specsRoot = path.join(repoRoot, 'openspec/specs');
const indexPath = path.join(
  docsRoot,
  'src/content/docs/capability-specs/index.md',
);

const entries = await readdir(specsRoot, { withFileTypes: true });
const expected = entries
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const indexMarkdown = await readFile(indexPath, 'utf8');
const start = '<!-- openspec-index:start -->';
const end = '<!-- openspec-index:end -->';
const startIndex = indexMarkdown.indexOf(start);
const endIndex = indexMarkdown.indexOf(end);

if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
  throw new Error(`Missing OpenSpec index markers in ${indexPath}`);
}

const checkedBlock = indexMarkdown.slice(startIndex + start.length, endIndex);
const listed = [...checkedBlock.matchAll(/^- `([^`]+)`/gm)]
  .map((match) => match[1])
  .sort();

const expectedSet = new Set(expected);
const listedSet = new Set(listed);
const missing = expected.filter((name) => !listedSet.has(name));
const stale = listed.filter((name) => !expectedSet.has(name));

if (missing.length > 0 || stale.length > 0) {
  const details = [
    missing.length > 0
      ? `Missing specs:\n${missing.map((name) => `  - ${name}`).join('\n')}`
      : '',
    stale.length > 0
      ? `Stale specs:\n${stale.map((name) => `  - ${name}`).join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  throw new Error(`OpenSpec capability index is out of sync.\n\n${details}`);
}

console.log(`OpenSpec capability index is in sync (${expected.length} specs).`);
