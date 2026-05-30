import { BadRequestException } from '@nestjs/common';

import { ImportController } from './import.controller';
import type { ImportService } from './import.service';

describe('ImportController', () => {
  it('rejects invalid payloads before calling the import service', async () => {
    const importCollection = jest.fn();
    const service = {
      importCollection,
    } as unknown as ImportService;
    const controller = new ImportController(service);

    await expect(
      controller.importCollection({
        status: 'maybe_later',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(importCollection).not.toHaveBeenCalled();
  });

  it('passes valid parsed payloads to the import service', async () => {
    const importCollection = jest.fn().mockResolvedValue({
      collectionId: 'collection-1',
      createdItems: 1,
      updatedItems: 0,
      authors: 1,
      updatedAt: '2026-05-12T15:30:00.000Z',
    });
    const service = {
      importCollection,
    } as unknown as ImportService;
    const controller = new ImportController(service);

    const response = await controller.importCollection({
      source: 'sample-dom-adapter',
      status: 'pending_download',
      capturedAt: '2026-05-12T15:30:00.000Z',
      collection: {
        id: 'collection-1',
        sourceUrl: 'https://example.test/collections/1',
        title: 'Saved notes',
      },
      items: [
        {
          id: 'note-1',
          title: 'First note',
          noteUrl: 'https://example.test/notes/1',
          author: { id: 'author-1', name: 'Alice' },
        },
      ],
    });

    expect(response.collectionId).toBe('collection-1');
    expect(importCollection).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending_download' }),
    );
  });
});
