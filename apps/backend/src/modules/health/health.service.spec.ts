import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns ok status payload with ISO timestamp', () => {
    const service = new HealthService();

    const result = service.getStatus();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('backend');
    expect(typeof result.timestamp).toBe('string');
    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
  });
});
