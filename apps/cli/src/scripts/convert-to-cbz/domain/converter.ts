import type {
  ConversionOptions,
  FailureRecord,
  PageAsset,
  SourceComicFile,
  SourceType,
} from './conversion-types';

export type ConvertProgress = {
  readonly current: number;
  readonly total: number;
  readonly message?: string;
};

export type ConvertContext = {
  readonly options: ConversionOptions;
  readonly onProgress?: (file: SourceComicFile, value: ConvertProgress) => void;
};

export type ConvertOk = {
  readonly ok: true;
  readonly pages: ReadonlyArray<PageAsset>;
};

export type ConvertErr = {
  readonly ok: false;
  readonly failure: FailureRecord;
};

export type ConvertResult = ConvertOk | ConvertErr;

export interface Converter {
  readonly sourceType: SourceType;
  convert(file: SourceComicFile, ctx: ConvertContext): Promise<ConvertResult>;
}
