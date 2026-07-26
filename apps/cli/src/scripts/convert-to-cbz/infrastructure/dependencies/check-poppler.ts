import { spawn } from 'node:child_process';
import { ResultAsync } from 'neverthrow';

export type PopplerCheckError = { readonly message: string };

const runVersion = (
  bin: 'pdfimages' | 'pdfinfo' | 'pdftoppm',
): Promise<boolean> =>
  new Promise((resolve) => {
    const child = spawn(bin, ['-v'], { stdio: 'ignore' });
    child.on('error', () => resolve(false));
    child.on('close', (code) => resolve(code === 0));
  });

const installHintByPlatform = (): string => {
  switch (process.platform) {
    case 'darwin':
      return 'Install Poppler: brew install poppler';
    case 'win32':
      return 'Install Poppler: winget install oschwartz10612.Poppler';
    default:
      return 'Install Poppler: sudo apt-get install poppler-utils';
  }
};

export const checkPoppler = (): ResultAsync<true, PopplerCheckError> =>
  ResultAsync.fromPromise(
    Promise.all([
      runVersion('pdfinfo'),
      runVersion('pdfimages'),
      runVersion('pdftoppm'),
    ]).then(([pdfinfoOk, pdfimagesOk, pdftoppmOk]) => {
      if (!pdfinfoOk || !pdfimagesOk || !pdftoppmOk) {
        throw new Error(installHintByPlatform());
      }
      return true as const;
    }),
    (e) => ({ message: e instanceof Error ? e.message : String(e) }),
  );
