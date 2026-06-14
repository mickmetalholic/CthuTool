import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { SitesConfigService } from '../sites-config/sites-config.service';
import { AgentBrowserCaptureProvider } from './agent-browser-capture.provider';
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
    expect(moduleRef.get(SitesConfigService)).toBeInstanceOf(
      SitesConfigService,
    );

    await moduleRef.close();
  });
});
