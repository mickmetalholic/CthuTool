import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AgentBrowserCaptureProvider } from '../browser-agent-capture/agent-browser-capture.provider';
import { BrowserContentService } from '../browser-content/browser-content.service';
import { SitesConfigService } from '../sites-config/sites-config.service';
import { BrowserAutomationModule } from './browser-automation.module';

describe('BrowserAutomationModule', () => {
  it('resolves the agent-backed browser provider dependencies', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [BrowserAutomationModule],
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
    expect(moduleRef.get(BrowserContentService)).toBeInstanceOf(
      BrowserContentService,
    );
    expect(moduleRef.get(SitesConfigService)).toBeInstanceOf(
      SitesConfigService,
    );

    await moduleRef.close();
  });
});
