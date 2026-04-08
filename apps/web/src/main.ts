import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { parseServiceConfiguration } from './config/service-configuration.schema';
import { HttpExceptionFilter } from './filters/http-exception.filter';

type BootstrapLogger = Pick<Logger, 'error' | 'log'>;

type BootstrapDeps = {
  createApp: typeof NestFactory.create;
  parseConfig: typeof parseServiceConfiguration;
  createLogger: (context: string) => BootstrapLogger;
  exit: (code: number) => unknown;
};

const defaultBootstrapDeps: BootstrapDeps = {
  createApp: NestFactory.create,
  parseConfig: parseServiceConfiguration,
  createLogger: (context) => new Logger(context),
  exit: (code) => process.exit(code),
};

export async function bootstrap(
  deps: BootstrapDeps = defaultBootstrapDeps,
): Promise<void> {
  const logger = deps.createLogger('Bootstrap');

  const configResult = deps.parseConfig(process.env);
  if (configResult.isErr()) {
    logger.error('configuration validation failed', {
      code: 'CONFIG_INVALID',
      details: configResult.error.message,
      timestamp: new Date().toISOString(),
    });
    deps.exit(1);
    return;
  }

  const config = configResult.value;

  const app = await deps.createApp(AppModule);

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(config.port);
  logger.log('service started', {
    service: 'web',
    nodeEnv: config.nodeEnv,
    port: config.port,
    timestamp: new Date().toISOString(),
  });
}

if (require.main === module) {
  void bootstrap();
}
