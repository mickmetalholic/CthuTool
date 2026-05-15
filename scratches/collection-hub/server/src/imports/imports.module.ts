import { Module } from '@nestjs/common';

import { StorageModule } from '../storage/storage.module';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';

@Module({
  controllers: [ImportController],
  exports: [ImportService],
  imports: [StorageModule],
  providers: [ImportService],
})
export class ImportsModule {}
