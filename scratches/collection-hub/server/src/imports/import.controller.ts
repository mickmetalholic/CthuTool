import {
  BadRequestException,
  Body,
  Controller,
  InternalServerErrorException,
  Post,
} from '@nestjs/common';

import {
  createApiError,
  parseImportCollectionRequest,
} from '@collection-hub/libs';

import { ImportService } from './import.service';

@Controller('imports/collections')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post()
  async importCollection(@Body() body: unknown) {
    const parsed = parseImportCollectionRequest(body);
    if (!parsed.success) {
      throw new BadRequestException(
        createApiError(
          'VALIDATION_ERROR',
          'Invalid import payload',
          parsed.issues,
        ),
      );
    }

    try {
      return await this.importService.importCollection(parsed.output);
    } catch {
      throw new InternalServerErrorException(
        createApiError('STORAGE_ERROR', 'Failed to persist import'),
      );
    }
  }
}
