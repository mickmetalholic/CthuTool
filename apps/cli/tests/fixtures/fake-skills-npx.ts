import { chmod, mkdir, writeFile } from 'node:fs/promises';
import { delimiter, join } from 'node:path';

/**
 * Run CLI integration tests without fetching the pinned skills CLI from npm.
 * The tests below only need an empty installed-skills listing.
 */
export async function createFakeSkillsNpxEnv(
  root: string,
): Promise<NodeJS.ProcessEnv> {
  const binRoot = join(root, 'fake-skills-bin');
  const scriptPath = join(binRoot, 'fake-npx.mjs');
  const script = `const args = process.argv.slice(2);\nif (args[0] === '--yes' && args[1] === 'skills@1.5.19' && args.includes('list')) {\n  process.stdout.write('[]');\n} else {\n  process.stderr.write('unexpected fake npx args: ' + args.join(' '));\n  process.exitCode = 1;\n}\n`;

  await mkdir(binRoot, { recursive: true });
  await writeFile(scriptPath, script, 'utf8');
  if (process.platform !== 'win32') {
    const executable = join(binRoot, 'npx');
    await writeFile(executable, `#!/usr/bin/env node\n${script}`, 'utf8');
    await chmod(executable, 0o755);
  }

  return {
    PATH: `${binRoot}${delimiter}${process.env.PATH ?? ''}`,
    CHC_SKILLS_NPX_CLI_PATH: scriptPath,
  };
}
