import { Injectable } from '@nestjs/common';
import type {
  BrowserCaptureSnapshot,
  BrowserDetection,
} from '../shared/browser.types';

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

    const finalUrl = snapshot.finalUrl.toLowerCase();
    const content = [
      snapshot.finalUrl,
      snapshot.title ?? '',
      snapshot.text ?? '',
    ]
      .join('\n')
      .toLowerCase();

    if (
      content.includes('captcha') ||
      content.includes('验证码') ||
      content.includes('异常访问')
    ) {
      return {
        kind: 'captcha_required',
        reason:
          'Page content indicates captcha or abnormal access verification',
      };
    }

    if (isLoginRequiredSignal(finalUrl, content)) {
      return {
        kind: 'login_required',
        reason: 'Final URL or page content indicates login is required',
      };
    }

    return { kind: 'ok' };
  }
}

function isLoginRequiredSignal(finalUrl: string, content: string): boolean {
  return (
    finalUrl.includes('/passport/login') ||
    finalUrl.includes('/accounts/login') ||
    finalUrl.includes('/login?') ||
    finalUrl.includes('/signin') ||
    content.includes('please sign in') ||
    content.includes('sign in to continue') ||
    content.includes('请先登录') ||
    content.includes('请登录后') ||
    content.includes('登录后继续') ||
    content.includes('账号密码登录')
  );
}
