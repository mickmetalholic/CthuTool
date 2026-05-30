import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: '@collection-hub/server',
      timestamp: new Date().toISOString(),
    };
  }
}
