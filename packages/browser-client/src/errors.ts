import type { BrowserClientErrorCode } from './types';

export type BrowserClientErrorOptions = {
  readonly code: BrowserClientErrorCode | string;
  readonly message: string;
  readonly status?: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly cause?: unknown;
};

export class BrowserClientError extends Error {
  readonly code: BrowserClientErrorCode | string;
  readonly status?: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
  override readonly cause?: unknown;

  constructor(options: BrowserClientErrorOptions) {
    super(options.message);
    this.name = 'BrowserClientError';
    this.code = options.code;
    this.status = options.status;
    this.metadata = options.metadata;
    this.cause = options.cause;
  }
}
