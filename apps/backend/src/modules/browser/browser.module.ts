import { Module } from '@nestjs/common';
import { BrowserAuthModule } from './auth/browser-auth.module';
import { BrowserService } from './browser.service';
import { BrowserContentModule } from './content/browser-content.module';
import { DesktopBrowserRuntimeModule } from './desktop-runtime/desktop-browser-runtime.module';
import { BrowserPublicApiModule } from './public-api/browser-public-api.module';

@Module({
  imports: [
    BrowserAuthModule,
    BrowserContentModule,
    DesktopBrowserRuntimeModule,
    BrowserPublicApiModule,
  ],
  exports: [BrowserService],
  providers: [BrowserService],
})
export class BrowserModule {}
