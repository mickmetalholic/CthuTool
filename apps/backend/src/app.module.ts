import { Module } from '@nestjs/common';
import { MetricsModule } from './metrics';
import { AgentModule } from './modules/agent/agent.module';
import { BrowserAuthModule } from './modules/browser/auth/browser-auth.module';
import { BrowserContentModule } from './modules/browser/content/browser-content.module';
import { DesktopBrowserRuntimeModule } from './modules/browser/desktop-runtime/desktop-browser-runtime.module';
import { BrowserSitesModule } from './modules/browser/sites/browser-sites.module';
import { DoubanMovieInfoModule } from './modules/douban-movie-info/douban-movie-info.module';
import { HealthModule } from './modules/health/health.module';
import { ObservabilityModule } from './observability';

@Module({
  imports: [
    MetricsModule,
    ObservabilityModule,
    AgentModule,
    BrowserAuthModule,
    BrowserContentModule,
    DesktopBrowserRuntimeModule,
    BrowserSitesModule,
    DoubanMovieInfoModule,
    HealthModule,
  ],
})
export class AppModule {}
