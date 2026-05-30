import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';

import {
  createApiError,
  parseDeleteItemsRequest,
  parseMoveItemRequest,
  parseRateItemRequest,
} from '@collection-hub/libs';

import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard() {
    try {
      return await this.dashboardService.getDashboard();
    } catch {
      throw new InternalServerErrorException(
        createApiError('STORAGE_ERROR', 'Failed to read dashboard data'),
      );
    }
  }

  @Delete('items/:itemId')
  async deleteItem(@Param('itemId') itemId: string) {
    try {
      const result = await this.dashboardService.deleteItem(itemId);
      if (!result.deleted) {
        throw new NotFoundException(
          createApiError('NOT_FOUND', 'Item not found'),
        );
      }
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        createApiError('STORAGE_ERROR', 'Failed to delete item'),
      );
    }
  }

  @Post('items/bulk-delete')
  @Delete('items')
  async deleteItems(@Body() body: unknown) {
    const parsed = parseDeleteItemsRequest(body);
    if (!parsed.success) {
      throw new BadRequestException(
        createApiError(
          'VALIDATION_ERROR',
          'Invalid delete payload',
          parsed.issues,
        ),
      );
    }

    try {
      return await this.dashboardService.deleteItems(parsed.output);
    } catch {
      throw new InternalServerErrorException(
        createApiError('STORAGE_ERROR', 'Failed to delete items'),
      );
    }
  }

  @Post('items/:itemId/move')
  async moveItem(@Param('itemId') itemId: string, @Body() body: unknown) {
    const parsed = parseMoveItemRequest(body);
    if (!parsed.success) {
      throw new BadRequestException(
        createApiError(
          'VALIDATION_ERROR',
          'Invalid move payload',
          parsed.issues,
        ),
      );
    }

    try {
      const result = await this.dashboardService.moveItem(
        itemId,
        parsed.output.targetStatus,
      );
      if (!result) {
        throw new NotFoundException(
          createApiError('NOT_FOUND', 'Item not found'),
        );
      }
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        createApiError('STORAGE_ERROR', 'Failed to move item'),
      );
    }
  }

  @Post('items/:itemId/rating')
  async rateItem(@Param('itemId') itemId: string, @Body() body: unknown) {
    const parsed = parseRateItemRequest(body);
    if (!parsed.success) {
      throw new BadRequestException(
        createApiError(
          'VALIDATION_ERROR',
          'Invalid rating payload',
          parsed.issues,
        ),
      );
    }

    try {
      const result = await this.dashboardService.rateItem(
        itemId,
        parsed.output.rating,
      );
      if (!result) {
        throw new NotFoundException(
          createApiError('NOT_FOUND', 'Item not found'),
        );
      }
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        createApiError('STORAGE_ERROR', 'Failed to rate item'),
      );
    }
  }
}
