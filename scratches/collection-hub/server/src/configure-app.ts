import type { NestExpressApplication } from '@nestjs/platform-express';

const defaultBodyLimit = '25mb';

export function configureCollectionHubApp(app: NestExpressApplication) {
  const bodyLimit =
    process.env.COLLECTION_HUB_HTTP_BODY_LIMIT ?? defaultBodyLimit;

  app.setGlobalPrefix('api');
  app.useBodyParser('json', { limit: bodyLimit });
  app.useBodyParser('urlencoded', { extended: true, limit: bodyLimit });
  app.enableCors({ origin: true });
}
