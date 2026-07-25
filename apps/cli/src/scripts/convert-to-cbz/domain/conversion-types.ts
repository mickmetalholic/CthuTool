export type SourceType = 'pdf' | 'epub';
export type ImageFormat = 'png' | 'jpg' | 'webp';

export type ConversionOptions = {
  readonly input: string;
  readonly output?: string;
  readonly overwrite?: boolean;
  readonly imageFormat: ImageFormat;
  readonly imageQuality: number;
  readonly dpi: number;
  readonly fileConcurrency: number;
  readonly epubRenderConcurrency: number;
};

export type SourceComicFile = {
  readonly sourcePath: string;
  readonly relativePath: string;
  readonly sourceType: SourceType;
  readonly targetCbzPath: string;
};

export type PageAsset = {
  readonly index: number;
  readonly tempPath: string;
  readonly archiveName: string;
  readonly format: ImageFormat;
  readonly quality: number;
};

export type ConversionWorkspace = {
  readonly rootPath: string;
  dispose(): Promise<void>;
};

export type FailureStage = 'scan' | 'read' | 'convert' | 'archive' | 'write';

export type FailureRecord = {
  readonly sourcePath: string;
  readonly stage: FailureStage;
  readonly reason: string;
  readonly recoverable: boolean;
};

export type ConversionSummary = {
  readonly totalFiles: number;
  readonly successCount: number;
  readonly convertedCount: number;
  readonly skippedCount: number;
  readonly failureCount: number;
  readonly failures: ReadonlyArray<FailureRecord>;
  readonly outputRoot: string;
  readonly durationMs: number;
};
