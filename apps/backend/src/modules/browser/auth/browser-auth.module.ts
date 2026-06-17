import { Module } from '@nestjs/common';
import { DesktopBrowserRuntimeModule } from '../desktop-runtime/desktop-browser-runtime.module';
import { BrowserAuthController } from './browser-auth.controller';
import { BrowserAuthService } from './browser-auth.service';

@Module({
  controllers: [BrowserAuthController],
  imports: [DesktopBrowserRuntimeModule],
  exports: [BrowserAuthService],
  providers: [BrowserAuthService],
})
export class BrowserAuthModule {}
