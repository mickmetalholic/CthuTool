import { Injectable } from '@nestjs/common';
import { chromium, type Browser, type Route } from 'playwright';
import type {
  BrowserProvider,
  BrowserProviderRequest,
  BrowserProviderSnapshot,
  BrowserResourceType,
} from './browser-automation.types';

export type LocalPlaywrightProviderOptions = {
  readonly headless: boolean;
  readonly dataDir: string;
};

@Injectable()
export class LocalPlaywrightProvider implements BrowserProvider {
  constructor(
    private readonly options: LocalPlaywrightProviderOptions = {
      headless: true,
      dataDir: './data/browser',
    },
  ) {}

  async capturePage(
    request: BrowserProviderRequest,
  ): Promise<BrowserProviderSnapshot> {
    let browser: Browser | undefined;
    try {
      browser = await chromium.launch({
        headless: this.options.headless,
      });
      const context = await browser.newContext({
        ...(request.storageState
          ? { storageState: request.storageState as never }
          : {}),
      });
      if (request.blockResources && request.blockResources.length > 0) {
        const blocked = new Set(request.blockResources);
        await context.route('**/*', (route) =>
          handleResourceRoute(route, blocked),
        );
      }
      const page = await context.newPage();
      const response = await page.goto(request.url, {
        timeout: request.timeoutMs,
        waitUntil: request.waitUntil ?? 'domcontentloaded',
      });
      const html = request.includeHtml ? await page.content() : undefined;
      const text = request.includeText
        ? await page.locator('body').textContent()
        : undefined;
      const screenshot = request.includeScreenshot
        ? await page.screenshot({ fullPage: true })
        : undefined;
      return {
        finalUrl: page.url(),
        status: response?.status(),
        title: await page.title(),
        ...(html !== undefined ? { html } : {}),
        ...(text !== undefined ? { text: text ?? '' } : {}),
        ...(screenshot !== undefined ? { screenshot } : {}),
      };
    } finally {
      await browser?.close();
    }
  }
}

function handleResourceRoute(
  route: Route,
  blocked: ReadonlySet<BrowserResourceType>,
): Promise<void> {
  return blocked.has(route.request().resourceType() as BrowserResourceType)
    ? route.abort()
    : route.continue();
}
