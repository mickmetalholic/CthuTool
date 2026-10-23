import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Windows cannot spawn npm.cmd as a native executable. Use the npm CLI shipped
// with the running Node, preserving argv boundaries and the launcher's prefix.
export function resolveNodeCommand(
  command: string,
  args: readonly string[],
  platform: NodeJS.Platform = process.platform,
  node = process.execPath,
) {
  if (platform === 'win32' && /^(?:npm|npm\.cmd)$/i.test(command)) {
    const cli = join(dirname(node), 'node_modules/npm/bin/npm-cli.js');
    if (!existsSync(cli))
      throw new Error(
        'The Node 24 runtime is missing its npm CLI; reinstall the complete Node/npm archive before relinking chc.',
      );
    return { command: node, args: [cli, ...args] };
  }
  return { command, args: [...args] };
}
