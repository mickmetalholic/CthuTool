import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { BrowserBlockDetector } from './browser-block-detector';
import { BrowserContentModule } from './browser-content.module';
import { BrowserContentService } from './browser-content.service';
import { BrowserDiagnosticsStore } from './browser-diagnostics.store';
import { BrowserTaskRunner } from './browser-task-runner';

describe('BrowserContentModule', () => {
  it('exports content service and owns content pipeline providers', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [BrowserContentModule],
    })
      .overrideProvider(HttpAdapterHost)
      .useValue({
        httpAdapter: {
          getHttpServer: () => ({ off: jest.fn(), on: jest.fn() }),
        },
      })
      .compile();

    expect(moduleRef.get(BrowserContentService)).toBeInstanceOf(
      BrowserContentService,
    );
    expect(moduleRef.get(BrowserTaskRunner)).toBeInstanceOf(BrowserTaskRunner);
    expect(moduleRef.get(BrowserBlockDetector)).toBeInstanceOf(
      BrowserBlockDetector,
    );
    expect(moduleRef.get(BrowserDiagnosticsStore)).toBeInstanceOf(
      BrowserDiagnosticsStore,
    );

    await moduleRef.close();
  });
});
