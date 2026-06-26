import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
// Nest DI needs runtime class reference; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import {
  type ClientEventAcceptedResponse,
  ClientEventsService,
} from './client-events.service';

@Controller('api/client-events')
export class ClientEventsController {
  constructor(private readonly clientEvents: ClientEventsService) {}

  @Post('/')
  @HttpCode(202)
  accept(
    @Body() body: unknown,
    @Req() request: Request,
  ): ClientEventAcceptedResponse {
    return this.clientEvents.accept(body, request);
  }
}
