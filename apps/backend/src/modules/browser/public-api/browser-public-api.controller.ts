import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OperatorAccessGuard } from '../../operator-access/operator-access.guard';
// Nest DI needs runtime class reference.
// biome-ignore lint/style/useImportType: constructor injection token
import { BrowserPublicApiService } from './browser-public-api.service';

@Controller('api/browser')
@UseGuards(OperatorAccessGuard)
export class BrowserPublicApiController {
  constructor(private readonly browserApi: BrowserPublicApiService) {}

  @Post('/sessions')
  createSession(@Body() body: unknown) {
    return this.browserApi.createSession(body);
  }

  @Post('/sessions/:sessionId/actions')
  runActions(@Param('sessionId') sessionId: string, @Body() body: unknown) {
    return this.browserApi.runActions(sessionId, body);
  }

  @Delete('/sessions/:sessionId')
  closeSession(@Param('sessionId') sessionId: string) {
    return this.browserApi.closeSession(sessionId);
  }
}
