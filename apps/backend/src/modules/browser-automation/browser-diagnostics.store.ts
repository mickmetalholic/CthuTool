import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { BrowserDiagnosticsSummary } from './browser-automation.types';

export type BrowserDiagnosticsStoreOptions = {
  readonly diagnosticsDir: string;
  readonly enabled: boolean;
};

export type BrowserDiagnosticsInput = {
  readonly errorCode: string;
  readonly finalUrl?: string;
  readonly html?: string;
  readonly screenshot?: Buffer;
  readonly summary: string;
};

@Injectable()
export class BrowserDiagnosticsStore {
  constructor(
    private readonly options: BrowserDiagnosticsStoreOptions = {
      diagnosticsDir: './data/browser-diagnostics',
      enabled: true,
    },
  ) {}

  async save(
    input: BrowserDiagnosticsInput,
  ): Promise<BrowserDiagnosticsSummary | undefined> {
    if (!this.options.enabled) {
      return undefined;
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const directory = join(this.options.diagnosticsDir, id);
    await mkdir(directory, { recursive: true });
    await writeFile(
      join(directory, 'metadata.json'),
      `${JSON.stringify(
        {
          errorCode: input.errorCode,
          finalUrl: input.finalUrl,
          summary: input.summary,
          capturedAt: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
      'utf8',
    );
    if (input.html !== undefined) {
      await writeFile(join(directory, 'page.html'), input.html, 'utf8');
    }
    if (input.screenshot !== undefined) {
      await writeFile(join(directory, 'screenshot.png'), input.screenshot);
    }
    return { id, summary: input.summary };
  }
}
