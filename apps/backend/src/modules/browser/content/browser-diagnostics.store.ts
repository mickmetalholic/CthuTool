import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { getCurrentRequestContext } from '../../../observability';
import type { BrowserDiagnosticsSummary } from '../../browser-automation/browser-automation.types';

export const BROWSER_DIAGNOSTICS_STORE_OPTIONS =
  'BROWSER_DIAGNOSTICS_STORE_OPTIONS';

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

export type BrowserDiagnosticsStoreStatus = {
  readonly diagnosticsDir: string;
  readonly enabled: boolean;
};

const DEFAULT_BROWSER_DIAGNOSTICS_STORE_OPTIONS: BrowserDiagnosticsStoreOptions =
  {
    diagnosticsDir: './data/browser-diagnostics',
    enabled: true,
  };

@Injectable()
export class BrowserDiagnosticsStore {
  private readonly options: BrowserDiagnosticsStoreOptions;

  constructor(
    @Optional()
    @Inject(BROWSER_DIAGNOSTICS_STORE_OPTIONS)
    options?: BrowserDiagnosticsStoreOptions,
  ) {
    this.options = options ?? DEFAULT_BROWSER_DIAGNOSTICS_STORE_OPTIONS;
  }

  async save(
    input: BrowserDiagnosticsInput,
  ): Promise<BrowserDiagnosticsSummary | undefined> {
    if (!this.options.enabled) {
      return undefined;
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const requestContext = getCurrentRequestContext();
    const directory = join(this.options.diagnosticsDir, id);
    await mkdir(directory, { recursive: true });
    await writeFile(
      join(directory, 'metadata.json'),
      `${JSON.stringify(
        {
          errorCode: input.errorCode,
          finalUrl: input.finalUrl,
          requestId: requestContext?.requestId,
          traceId: requestContext?.traceId,
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

  getStatus(): BrowserDiagnosticsStoreStatus {
    return {
      diagnosticsDir: this.options.diagnosticsDir,
      enabled: this.options.enabled,
    };
  }
}
