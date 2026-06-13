import { Injectable } from '@nestjs/common';
import type { BrowserSiteConfig } from './browser-automation.types';

const DEFAULT_BROWSER_SITES: readonly BrowserSiteConfig[] = [
  {
    allowedOrigins: ['https://movie.douban.com', 'https://www.douban.com'],
    authPolicy: 'required',
    displayName: 'Douban',
    loginUrl: 'https://accounts.douban.com/passport/login',
    profileName: 'douban-main',
    siteId: 'douban',
    verifyUrl: 'https://www.douban.com/mine/',
  },
  {
    allowedOrigins: ['https://www.zhihu.com', 'https://zhuanlan.zhihu.com'],
    authPolicy: 'required',
    displayName: 'Zhihu',
    loginUrl: 'https://www.zhihu.com/signin',
    profileName: 'zhihu-main',
    siteId: 'zhihu',
    verifyUrl: 'https://www.zhihu.com/',
  },
];

@Injectable()
export class BrowserSiteConfigService {
  private readonly sites = new Map<string, BrowserSiteConfig>(
    DEFAULT_BROWSER_SITES.map((site) => [site.siteId, site]),
  );

  listSites(): BrowserSiteConfig[] {
    return [...this.sites.values()].map(copySiteConfig);
  }

  getSite(siteId: string): BrowserSiteConfig | undefined {
    const site = this.sites.get(siteId);
    return site ? copySiteConfig(site) : undefined;
  }

  resolveForUrl(url: string): BrowserSiteConfig | undefined {
    const origin = new URL(url).origin;
    return this.listSites().find((site) =>
      site.allowedOrigins.includes(origin),
    );
  }
}

function copySiteConfig(site: BrowserSiteConfig): BrowserSiteConfig {
  return {
    ...site,
    allowedOrigins: [...site.allowedOrigins],
    ...(site.defaultBlockResources
      ? { defaultBlockResources: [...site.defaultBlockResources] }
      : {}),
  };
}
