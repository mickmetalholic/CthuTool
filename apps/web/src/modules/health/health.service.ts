import { Injectable } from '@nestjs/common';

type HealthStatus = {
  status: 'ok';
  service: string;
  timestamp: string;
};

@Injectable()
export class HealthService {
  getStatus(): HealthStatus {
    return {
      status: 'ok',
      service: 'web',
      timestamp: new Date().toISOString(),
    };
  }
}
