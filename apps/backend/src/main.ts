import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { type INestApplication, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { config as loadDotenv } from 'dotenv';
import { AppModule } from './app.module';
import { parseServiceConfiguration } from './config/service-configuration';
import { HttpExceptionFilter } from './filters/http-exception.filter';

type BootstrapLogger = Pick<Logger, 'error' | 'log'>;

type BootstrapDeps = {
  createApp: (module: typeof AppModule) => Promise<INestApplication>;
  parseConfig: typeof parseServiceConfiguration;
  loadEnv: () => unknown;
  createLogger: (context: string) => BootstrapLogger;
  exit: (code: number) => unknown;
};

const defaultBootstrapDeps: BootstrapDeps = {
  createApp: (module) => NestFactory.create(module),
  parseConfig: parseServiceConfiguration,
  loadEnv: () => loadDotenv({ path: resolveEnvFilePath() }),
  createLogger: (context) => new Logger(context),
  exit: (code) => process.exit(code),
};

const resolveEnvFilePath = () => {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), 'apps/backend/.env'),
    resolve(__dirname, '../.env'),
    resolve(__dirname, '../../../.env'),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
};

export function configureApplication(app: INestApplication): void {
  app.enableCors({ origin: true });
  app.useGlobalFilters(new HttpExceptionFilter());
}

export async function bootstrap(
  deps: BootstrapDeps = defaultBootstrapDeps,
): Promise<void> {
  const logger = deps.createLogger('Bootstrap');

  deps.loadEnv();
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

  configureApplication(app);

  await app.listen(config.port);
  logger.log('service started', {
    service: 'backend',
    nodeEnv: config.nodeEnv,
    port: config.port,
    timestamp: new Date().toISOString(),
  });
}

if (require.main === module) {
  void bootstrap();
}
