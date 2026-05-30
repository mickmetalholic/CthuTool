import { Test, TestingModule } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { DashboardResponse } from '@collection-hub/libs';

import { AppModule } from './../src/app.module';
import { configureCollectionHubApp } from './../src/configure-app';

describe('Collection Hub API (e2e)', () => {
  let app: NestExpressApplication;
  let tempDir: string;
  let previousStorePath: string | undefined;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'collection-hub-api-'));
    previousStorePath = process.env.COLLECTION_HUB_STORE_PATH;
    process.env.COLLECTION_HUB_STORE_PATH = join(tempDir, 'store.json');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureCollectionHubApp(app);
    await app.init();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          status: 'ok',
          service: '@collection-hub/server',
        });
      });
  });

  it('imports a collection and exposes dashboard summaries', async () => {
    await request(app.getHttpServer())
      .post('/api/imports/collections')
      .send({
        source: 'xhs',
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
            mediaType: 'video',
            author: { id: 'author-1', name: 'Alice' },
          },
        ],
      })
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({
          collectionId: 'xhs:pending_download',
          createdItems: 1,
          updatedItems: 0,
          authors: 1,
        });
      });

    await request(app.getHttpServer())
      .get('/api/dashboard')
      .expect(200)
      .expect((response) => {
        const dashboard = response.body as DashboardResponse;

        expect(dashboard.totals).toEqual({
          collections: 3,
          items: 1,
          authors: 1,
        });
        expect(dashboard.statusCounts.pending_download).toBe(1);
        expect(dashboard.recentItems[0]).toMatchObject({
          collectionId: 'xhs:pending_download',
          collectionTitle: 'xhs / 待下载',
          source: 'xhs',
          mediaType: 'video',
        });
        expect(dashboard.items).toContainEqual(
          expect.objectContaining({
            id: 'note-1',
            collectionId: 'xhs:pending_download',
            status: 'pending_download',
          }),
        );
        expect(dashboard.collections).toContainEqual(
          expect.objectContaining({
            id: 'xhs:pending_download',
            status: 'pending_download',
            itemCount: 1,
          }),
        );
        expect(dashboard.authors).toContainEqual(
          expect.objectContaining({
            id: 'author-1',
            source: 'xhs',
            name: 'Alice',
          }),
        );
      });
  });

  it('rates an imported item through the dashboard API', async () => {
    await request(app.getHttpServer())
      .post('/api/imports/collections')
      .send({
        source: 'xhs',
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
          },
        ],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/dashboard/items/note-1/rating')
      .send({ rating: 'S' })
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({
          itemId: 'note-1',
          rating: 'S',
        });
      });

    await request(app.getHttpServer())
      .get('/api/dashboard')
      .expect(200)
      .expect((response) => {
        const dashboard = response.body as DashboardResponse;

        expect(dashboard.items).toContainEqual(
          expect.objectContaining({
            id: 'note-1',
            rating: 'S',
          }),
        );
      });
  });

  it('rejects invalid import payloads with a structured 400 error', () => {
    return request(app.getHttpServer())
      .post('/api/imports/collections')
      .send({ status: 'maybe_later' })
      .expect(400)
      .expect((response) => {
        expect(response.body).toMatchObject({
          code: 'VALIDATION_ERROR',
          message: 'Invalid import payload',
        });
      });
  });

  it('accepts large collection import payloads from browser captures', async () => {
    const largeRawSnapshot = 'x'.repeat(160_000);

    await request(app.getHttpServer())
      .post('/api/imports/collections')
      .send({
        source: 'xhs',
        status: 'pending_download',
        capturedAt: '2026-05-12T15:30:00.000Z',
        collection: {
          id: 'large-collection',
          sourceUrl: 'https://example.test/collections/large',
          title: 'Large saved notes',
        },
        items: [
          {
            id: 'large-note-1',
            title: 'Large note',
            noteUrl: 'https://example.test/notes/large-1',
            raw: {
              snapshot: largeRawSnapshot,
            },
          },
        ],
      })
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({
          collectionId: 'xhs:pending_download',
          createdItems: 1,
        });
      });
  });

  afterEach(async () => {
    await app.close();
    if (previousStorePath === undefined) {
      delete process.env.COLLECTION_HUB_STORE_PATH;
    } else {
      process.env.COLLECTION_HUB_STORE_PATH = previousStorePath;
    }
    await rm(tempDir, { force: true, recursive: true });
  });
});
