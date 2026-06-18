import { Module } from '@nestjs/common';
import { SitesConfigModule } from '../../sites-config/sites-config.module';
import { DesktopBrowserRuntimeModule } from '../desktop-runtime/desktop-browser-runtime.module';
import { BrowserBlockDetector } from './browser-block-detector';
import { BrowserContentService } from './browser-content.service';
import { BrowserDiagnosticsStore } from './browser-diagnostics.store';
import { BrowserTaskRunner } from './browser-task-runner';

@Module({
  imports: [DesktopBrowserRuntimeModule, SitesConfigModule],
  exports: [BrowserContentService],
  providers: [
    BrowserBlockDetector,
    BrowserContentService,
    BrowserDiagnosticsStore,
    BrowserTaskRunner,
  ],
})
export class BrowserContentModule {}
