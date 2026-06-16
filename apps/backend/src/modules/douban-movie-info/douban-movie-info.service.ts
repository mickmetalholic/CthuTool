import { Injectable } from '@nestjs/common';
import { BrowserAutomationError } from '../browser-automation/browser-automation.errors';
import type { BrowserDetectionKind } from '../browser-automation/browser-automation.types';
// biome-ignore lint/style/useImportType: constructor injection token
import { BrowserContentService } from '../browser-content/browser-content.service';
import { doubanMovieInfoError } from './douban-movie-info.errors';
import { parseDoubanMovieInfo } from './douban-movie-info.parser';
import type { DoubanMovieInfoResponse } from './douban-movie-info.types';
import {
  normalizeDoubanSubjectInput,
  toDoubanSubjectUrl,
} from './douban-subject';

@Injectable()
export class DoubanMovieInfoService {
  constructor(private readonly browserContent: BrowserContentService) {}

  async getMovie(input: string): Promise<DoubanMovieInfoResponse> {
    const subjectId = normalizeDoubanSubjectInput(input);
    const sourceUrl = toDoubanSubjectUrl(subjectId);
    const page = await this.fetchPage(subjectId, sourceUrl);
    if (page.detection.kind !== 'ok') {
      throw detectionToError(page.detection.kind, subjectId);
    }
    if (
      page.status === 404 ||
      /\/subject\/\d+\/?notfound/i.test(page.finalUrl)
    ) {
      throw doubanMovieInfoError(
        'NOT_FOUND',
        'Douban subject was not found',
        subjectId,
      );
    }
    if (!page.html) {
      throw doubanMovieInfoError(
        'PARSE_FAILED',
        'Browser capture did not include HTML content',
        subjectId,
      );
    }
    return {
      movie: parseDoubanMovieInfo({
        capturedAt: page.capturedAt,
        finalUrl: page.finalUrl,
        html: page.html,
        sourceUrl,
        subjectId,
      }),
    };
  }

  private async fetchPage(subjectId: string, sourceUrl: string) {
    try {
      return await this.browserContent.getPageContent({
        includeHtml: true,
        includeScreenshot: false,
        includeText: true,
        siteId: 'douban',
        suppressPendingAuthTask: true,
        url: sourceUrl,
        waitUntil: 'domcontentloaded',
      });
    } catch (error) {
      if (error instanceof BrowserAutomationError) {
        throw browserErrorToDomainError(error, subjectId);
      }
      throw error;
    }
  }
}

function detectionToError(kind: BrowserDetectionKind, subjectId: string) {
  if (kind === 'login_required') {
    return doubanMovieInfoError(
      'AUTH_REQUIRED',
      'Douban browser profile is missing, expired, or login is required',
      subjectId,
    );
  }
  if (kind === 'captcha_required') {
    return doubanMovieInfoError(
      'CAPTCHA_REQUIRED',
      'Douban requires captcha or abnormal-access verification',
      subjectId,
    );
  }
  if (kind === 'rate_limited') {
    return doubanMovieInfoError(
      'RATE_LIMITED',
      'Douban access is rate limited',
      subjectId,
    );
  }
  return doubanMovieInfoError('BLOCKED', 'Douban access is blocked', subjectId);
}

function browserErrorToDomainError(
  error: BrowserAutomationError,
  subjectId: string,
) {
  if (
    error.code === 'AUTH_PROFILE_REQUIRED' ||
    error.code === 'AUTH_PROFILE_EXPIRED' ||
    error.code === 'AUTH_STATE_MISSING'
  ) {
    return doubanMovieInfoError('AUTH_REQUIRED', error.message, subjectId);
  }
  if (error.code === 'NAVIGATION_TIMEOUT') {
    return doubanMovieInfoError('TIMEOUT', error.message, subjectId);
  }
  if (
    error.code === 'AGENT_NOT_AVAILABLE' ||
    error.code === 'BROWSER_UNAVAILABLE' ||
    error.code === 'BROWSER_AGENT_COMMAND_FAILED'
  ) {
    return doubanMovieInfoError(
      'BROWSER_UNAVAILABLE',
      error.message,
      subjectId,
    );
  }
  if (error.code === 'BLOCKED') {
    return doubanMovieInfoError('BLOCKED', error.message, subjectId);
  }
  return doubanMovieInfoError('BROWSER_UNAVAILABLE', error.message, subjectId);
}
