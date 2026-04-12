import { type ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

type MockResponse = {
  status: jest.Mock;
  json: jest.Mock;
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
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
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
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
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
});
