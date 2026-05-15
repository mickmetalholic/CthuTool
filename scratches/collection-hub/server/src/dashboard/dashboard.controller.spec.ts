import { BadRequestException, NotFoundException } from '@nestjs/common';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  it('deletes an item through the dashboard service', async () => {
    const service = {
      deleteItem: jest.fn().mockResolvedValue({
        deleted: true,
        itemId: 'note-1',
      }),
    } as unknown as DashboardService;
    const controller = new DashboardController(service);

    await expect(controller.deleteItem('note-1')).resolves.toEqual({
      deleted: true,
      itemId: 'note-1',
    });
  });

  it('throws not found when the item does not exist', async () => {
    const service = {
      deleteItem: jest.fn().mockResolvedValue({
        deleted: false,
        itemId: 'missing-note',
      }),
    } as unknown as DashboardService;
    const controller = new DashboardController(service);

    await expect(controller.deleteItem('missing-note')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('passes valid bulk delete payloads to the dashboard service', async () => {
    const deleteItems = jest.fn().mockResolvedValue({
      deletedItems: 1,
      skippedItems: 0,
      itemIds: ['note-1'],
      updatedAt: '2026-05-12T15:30:00.000Z',
    });
    const service = {
      deleteItems,
    } as unknown as DashboardService;
    const controller = new DashboardController(service);

    await expect(
      controller.deleteItems({
        source: 'xhs',
        status: 'pending_download',
        itemIds: ['note-1'],
      }),
    ).resolves.toMatchObject({
      deletedItems: 1,
      itemIds: ['note-1'],
    });
    expect(deleteItems).toHaveBeenCalledWith({
      source: 'xhs',
      status: 'pending_download',
      itemIds: ['note-1'],
    });
  });

  it('rejects invalid bulk delete payloads before calling the service', async () => {
    const deleteItems = jest.fn();
    const service = {
      deleteItems,
    } as unknown as DashboardService;
    const controller = new DashboardController(service);

    await expect(
      controller.deleteItems({
        source: 'xhs',
        status: 'maybe_later',
        itemIds: ['note-1'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(deleteItems).not.toHaveBeenCalled();
  });

  it('passes valid move payloads to the dashboard service', async () => {
    const moveItem = jest.fn().mockResolvedValue({
      collectionId: 'xhs:downloaded',
      itemId: 'note-1',
      moved: true,
      source: 'xhs',
      status: 'downloaded',
      updatedAt: '2026-05-12T15:30:00.000Z',
    });
    const service = {
      moveItem,
    } as unknown as DashboardService;
    const controller = new DashboardController(service);

    await expect(
      controller.moveItem('note-1', {
        targetStatus: 'downloaded',
      }),
    ).resolves.toMatchObject({
      collectionId: 'xhs:downloaded',
      itemId: 'note-1',
      status: 'downloaded',
    });
    expect(moveItem).toHaveBeenCalledWith('note-1', 'downloaded');
  });

  it('rejects invalid move payloads before calling the service', async () => {
    const moveItem = jest.fn();
    const service = {
      moveItem,
    } as unknown as DashboardService;
    const controller = new DashboardController(service);

    await expect(
      controller.moveItem('note-1', {
        targetStatus: 'maybe_later',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(moveItem).not.toHaveBeenCalled();
  });

  it('throws not found when moving a missing item', async () => {
    const moveItem = jest.fn().mockResolvedValue(null);
    const service = {
      moveItem,
    } as unknown as DashboardService;
    const controller = new DashboardController(service);

    await expect(
      controller.moveItem('missing-note', {
        targetStatus: 'downloaded',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('passes valid rating payloads to the dashboard service', async () => {
    const rateItem = jest.fn().mockResolvedValue({
      itemId: 'note-1',
      rating: 'S',
      updatedAt: '2026-05-12T15:30:00.000Z',
    });
    const service = {
      rateItem,
    } as unknown as DashboardService;
    const controller = new DashboardController(service);

    await expect(
      controller.rateItem('note-1', {
        rating: 'S',
      }),
    ).resolves.toMatchObject({
      itemId: 'note-1',
      rating: 'S',
    });
    expect(rateItem).toHaveBeenCalledWith('note-1', 'S');
  });

  it('rejects invalid rating payloads before calling the service', async () => {
    const rateItem = jest.fn();
    const service = {
      rateItem,
    } as unknown as DashboardService;
    const controller = new DashboardController(service);

    await expect(
      controller.rateItem('note-1', {
        rating: 'C',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(rateItem).not.toHaveBeenCalled();
  });

  it('throws not found when rating a missing item', async () => {
    const rateItem = jest.fn().mockResolvedValue(null);
    const service = {
      rateItem,
    } as unknown as DashboardService;
    const controller = new DashboardController(service);

    await expect(
      controller.rateItem('missing-note', {
        rating: 'A',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
