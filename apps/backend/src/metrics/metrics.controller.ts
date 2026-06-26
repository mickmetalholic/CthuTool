import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
// Nest DI needs runtime class reference; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { BackendMetricsService } from './metrics.service';

@Controller()
export class MetricsController {
  constructor(private readonly metrics: BackendMetricsService) {}

  @Get('/metrics')
  async getMetrics(@Res() response: Response): Promise<void> {
    response.setHeader('Content-Type', this.metrics.contentType());
    response.send(await this.metrics.metrics());
  }
}
