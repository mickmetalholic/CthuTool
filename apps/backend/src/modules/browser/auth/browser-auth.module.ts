import { Module } from '@nestjs/common';
import { DesktopBrowserRuntimeModule } from '../desktop-runtime/desktop-browser-runtime.module';
import { BrowserAuthService } from './browser-auth.service';

@Module({
  imports: [DesktopBrowserRuntimeModule],
  exports: [BrowserAuthService],
  providers: [BrowserAuthService],
})
export class BrowserAuthModule {}
