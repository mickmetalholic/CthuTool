import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

import type {
  AuthorDraft,
  CollectionItemRecord,
  CollectionRecord,
  ImportCollectionRequest,
  ImportSummary,
  ItemStatus,
  CollectionHubStore,
} from '@collection-hub/libs';
import {
  createDestinationCollectionId,
  createDestinationCollectionTitle,
  createDestinationCollections,
} from '@collection-hub/libs';

import { JsonStoreRepository } from '../storage/json-store.repository';

@Injectable()
export class ImportService {
  constructor(private readonly repository: JsonStoreRepository) {}

  async importCollection(
    request: ImportCollectionRequest,
  ): Promise<ImportSummary> {
    const updatedAt = new Date().toISOString();

    return this.repository.update((store) => {
      const collectionId = createDestinationCollectionId(
        request.source,
        request.status,
      );
      ensureDestinationCollections(store, request, updatedAt);
      const itemIds: string[] = [];
      const touchedAuthorIds = new Set<string>();
      let createdItems = 0;
      let updatedItems = 0;

      for (const item of request.items) {
        const itemId =
          item.id ??
          fallbackId(
            'item',
            request.source,
            request.collection.id ?? request.collection.sourceUrl,
            item.noteUrl,
            item.title,
          );
        const existingItem = store.items[itemId];
        const authorId = item.author
          ? upsertAuthor(item.author, request.source, store.authors, updatedAt)
          : undefined;

        if (authorId) {
          touchedAuthorIds.add(authorId);
        }
        if (existingItem) {
          updatedItems += 1;
        } else {
          createdItems += 1;
        }

        const nextItem: CollectionItemRecord = {
          id: itemId,
          source: request.source,
          collectionId,
          authorId,
          title: item.title,
          noteUrl: item.noteUrl,
          coverUrl: item.coverUrl,
          mediaType: item.mediaType,
          rating: existingItem?.rating,
          status: request.status,
          importedAt: existingItem?.importedAt ?? request.capturedAt,
          updatedAt,
          raw: item.raw,
        };
        store.items[itemId] = withoutUndefined(nextItem);
        itemIds.push(itemId);
      }

      moveItemsToDestinationCollection(
        store,
        request.source,
        request.status,
        itemIds,
      );
      refreshDestinationCollection(
        store,
        request,
        collectionId,
        itemIds,
        updatedAt,
      );

      return {
        collectionId,
        createdItems,
        updatedItems,
        authors: touchedAuthorIds.size,
        updatedAt,
      };
    });
  }
}

function ensureDestinationCollections(
  store: CollectionHubStore,
  request: ImportCollectionRequest,
  updatedAt: string,
): void {
  for (const destination of createDestinationCollections(request.source)) {
    const existingCollection = store.collections[destination.id];
    const nextCollection: CollectionRecord = {
      id: destination.id,
      source: request.source,
      status: destination.status,
      sourceUrl: existingCollection?.sourceUrl ?? request.collection.sourceUrl,
      title: destination.title,
      description: existingCollection?.description,
      coverUrl: existingCollection?.coverUrl,
      itemIds: existingCollection?.itemIds ?? [],
      importedAt: existingCollection?.importedAt ?? request.capturedAt,
      updatedAt: existingCollection?.updatedAt ?? updatedAt,
      raw: existingCollection?.raw,
    };
    store.collections[destination.id] = withoutUndefined(nextCollection);
  }
}

function moveItemsToDestinationCollection(
  store: CollectionHubStore,
  source: string,
  status: ItemStatus,
  itemIds: string[],
): void {
  const importedItemIds = new Set(itemIds);

  for (const collection of Object.values(store.collections)) {
    if (collection.source !== source || collection.status === status) {
      continue;
    }
    collection.itemIds = collection.itemIds.filter(
      (itemId) => !importedItemIds.has(itemId),
    );
  }
}

function refreshDestinationCollection(
  store: CollectionHubStore,
  request: ImportCollectionRequest,
  collectionId: string,
  importedItemIds: string[],
  updatedAt: string,
): void {
  const existingCollection = store.collections[collectionId];
  const importedItemIdSet = new Set(importedItemIds);
  const existingUnchangedIds =
    existingCollection?.itemIds.filter(
      (itemId) => !importedItemIdSet.has(itemId),
    ) ?? [];
  const nextCollection: CollectionRecord = {
    id: collectionId,
    source: request.source,
    status: request.status,
    sourceUrl: request.collection.sourceUrl,
    title: createDestinationCollectionTitle(request.source, request.status),
    description: request.collection.description,
    coverUrl: request.collection.coverUrl ?? existingCollection?.coverUrl,
    itemIds: [...importedItemIds, ...existingUnchangedIds],
    importedAt: existingCollection?.importedAt ?? request.capturedAt,
    updatedAt,
    raw: {
      sourceCollection: request.collection,
    },
  };

  store.collections[collectionId] = withoutUndefined(nextCollection);
}

function upsertAuthor(
  author: AuthorDraft,
  source: string,
  authors: Record<
    string,
    import('@collection-hub/libs').AuthorRecord
  >,
  updatedAt: string,
): string {
  const authorId =
    author.id ?? fallbackId('author', author.profileUrl ?? '', author.name);

  authors[authorId] = withoutUndefined({
    id: authorId,
    source,
    name: author.name,
    avatarUrl: author.avatarUrl,
    profileUrl: author.profileUrl,
    updatedAt,
    raw: author.raw,
  });

  return authorId;
}

function fallbackId(prefix: string, ...parts: string[]): string {
  const hash = createHash('sha256').update(parts.join('|')).digest('hex');
  return `${prefix}_${hash.slice(0, 16)}`;
}

function withoutUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;
}
