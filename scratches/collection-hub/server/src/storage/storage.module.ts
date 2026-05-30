import { Module } from '@nestjs/common';

import { JsonStoreRepository } from './json-store.repository';

@Module({
  exports: [JsonStoreRepository],
  providers: [JsonStoreRepository],
})
export class StorageModule {}
