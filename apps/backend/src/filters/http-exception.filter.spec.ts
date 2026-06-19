import { type ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import type { Mock } from 'vitest';
import { HttpExceptionFilter } from './http-exception.filter';

type MockResponse = {
  status: Mock;
  json: Mock;
};

const createMockHost = (response: MockResponse): ArgumentsHost =>
  ({
    switchToHttp: () => ({
      getResponse: () => response,
    }),
  }) as ArgumentsHost;

describe('HttpExceptionFilter', () => {
  it('maps not found to contract error payload', () => {
    const response: MockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const filter = new HttpExceptionFilter();
    const exception = new HttpException('not found', HttpStatus.NOT_FOUND);

    filter.catch(exception, createMockHost(response));

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'NOT_FOUND',
        message: 'Route not found',
      }),
    );
  });

  it('maps unknown errors to HTTP_ERROR payload', () => {
    const response: MockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const filter = new HttpExceptionFilter();

    filter.catch(new Error('boom'), createMockHost(response));

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'HTTP_ERROR',
        message: 'Request failed',
      }),
    );
  });

  it('preserves structured HttpException response bodies', () => {
    const response: MockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const filter = new HttpExceptionFilter();
    const exception = new HttpException(
      {
        code: 'AUTH_REQUIRED',
        message: 'Login required',
        subjectId: '1292052',
      },
      HttpStatus.UNAUTHORIZED,
    );

    filter.catch(exception, createMockHost(response));

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'AUTH_REQUIRED',
        message: 'Login required',
        subjectId: '1292052',
      }),
    );
  });
});
