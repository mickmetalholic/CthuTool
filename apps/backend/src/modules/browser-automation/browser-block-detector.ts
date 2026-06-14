import { Injectable } from '@nestjs/common';
import type {
  BrowserCaptureSnapshot,
  BrowserDetection,
} from './browser-automation.types';

@Injectable()
export class BrowserBlockDetector {
  detect(snapshot: BrowserCaptureSnapshot): BrowserDetection {
    if (snapshot.status === 429) {
      return {
        kind: 'rate_limited',
        reason: 'HTTP 429 indicates rate limiting',
      };
    }

    if (snapshot.status === 403) {
      return {
        kind: 'blocked',
        reason: 'HTTP 403 indicates blocked access',
      };
    }

    const haystack = [
      snapshot.finalUrl,
      snapshot.title ?? '',
      snapshot.text ?? '',
    ]
      .join('\n')
      .toLowerCase();

    if (
      haystack.includes('captcha') ||
      haystack.includes('验证码') ||
      haystack.includes('异常访问')
    ) {
      return {
        kind: 'captcha_required',
        reason:
          'Page content indicates captcha or abnormal access verification',
      };
    }

    if (
      haystack.includes('/passport/login') ||
      haystack.includes('/login') ||
      haystack.includes('please sign in') ||
      haystack.includes('登录')
    ) {
      return {
        kind: 'login_required',
        reason: 'Final URL or page content indicates login is required',
      };
    }

    return { kind: 'ok' };
  }
}
