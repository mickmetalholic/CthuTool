import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AgentBrowserCaptureProvider } from './agent-browser-capture.provider';
import { BrowserAgentCaptureModule } from './browser-agent-capture.module';
import { BROWSER_CAPTURE_PROVIDER } from './browser-agent-capture.tokens';

describe('BrowserAgentCaptureModule', () => {
  it('exports the agent-backed browser capture provider binding', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [BrowserAgentCaptureModule],
    })
      .overrideProvider(HttpAdapterHost)
      .useValue({
        httpAdapter: {
          getHttpServer: () => ({
            off: jest.fn(),
            on: jest.fn(),
          }),
        },
      })
      .compile();

    expect(moduleRef.get(AgentBrowserCaptureProvider)).toBeInstanceOf(
      AgentBrowserCaptureProvider,
    );
    expect(moduleRef.get(BROWSER_CAPTURE_PROVIDER)).toBeInstanceOf(
      AgentBrowserCaptureProvider,
    );

    await moduleRef.close();
  });
});
