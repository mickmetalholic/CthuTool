import { Injectable } from '@nestjs/common';

import {
  createDestinationCollectionId,
  createDestinationCollectionTitle,
  createEmptyStatusCounts,
  type AuthorRecord,
  type CollectionItemRecord,
  type CollectionRecord,
  type DashboardAuthorSummary,
  type DashboardCollectionSummary,
  type DashboardItemSummary,
  type DashboardResponse,
  type ItemRating,
  type ItemStatus,
  type StatusCounts,
} from '@collection-hub/libs';

import { JsonStoreRepository } from '../storage/json-store.repository';

export type DeleteItemsRequest = {
  itemIds: string[];
  source: string;
  status: ItemStatus;
};

export type DeleteItemsResult = {
  deletedItems: number;
  itemIds: string[];
  skippedItems: number;
  source: string;
  status: ItemStatus;
  updatedAt: string;
};

export type MoveItemResult = {
  collectionId: string;
  itemId: string;
  moved: boolean;
  source: string;
  status: ItemStatus;
  updatedAt: string;
};

export type RateItemResult = {
  itemId: string;
  rating: ItemRating;
  updatedAt: string;
};

@Injectable()
export class DashboardService {
  constructor(private readonly repository: JsonStoreRepository) {}

  async deleteItem(
    itemId: string,
  ): Promise<{ deleted: boolean; itemId: string }> {
    return this.repository.update((store) => {
      const existingItem = store.items[itemId];
      if (!existingItem) {
        return { deleted: false, itemId };
      }

      delete store.items[itemId];
      for (const collection of Object.values(store.collections)) {
        collection.itemIds = collection.itemIds.filter(
          (candidateId) => candidateId !== itemId,
        );
      }

      return { deleted: true, itemId };
    });
  }

  async deleteItems(request: DeleteItemsRequest): Promise<DeleteItemsResult> {
    const updatedAt = new Date().toISOString();

    return this.repository.update((store) => {
      const requestedItemIds = [...new Set(request.itemIds)];
      const deletedItemIds: string[] = [];
      const destinationCollectionId = `${request.source}:${request.status}`;

      for (const itemId of requestedItemIds) {
        const item = store.items[itemId];
        if (
          !item ||
          item.source !== request.source ||
          item.status !== request.status ||
          item.collectionId !== destinationCollectionId
        ) {
          continue;
        }

        delete store.items[itemId];
        deletedItemIds.push(itemId);
      }

      const deletedItemIdSet = new Set(deletedItemIds);
      for (const collection of Object.values(store.collections)) {
        collection.itemIds = collection.itemIds.filter(
          (candidateId) => !deletedItemIdSet.has(candidateId),
        );
      }

      return {
        deletedItems: deletedItemIds.length,
        itemIds: deletedItemIds,
        skippedItems: requestedItemIds.length - deletedItemIds.length,
        source: request.source,
        status: request.status,
        updatedAt,
      };
    });
  }

  async moveItem(
    itemId: string,
    targetStatus: ItemStatus,
  ): Promise<MoveItemResult | null> {
    const updatedAt = new Date().toISOString();

    return this.repository.update((store) => {
      const item = store.items[itemId];
      if (!item) {
        return null;
      }

      const destinationCollectionId = createDestinationCollectionId(
        item.source,
        targetStatus,
      );
      const previousCollection = store.collections[item.collectionId];
      const destinationCollection =
        store.collections[destinationCollectionId] ??
        createDestinationCollection(
          item.source,
          targetStatus,
          previousCollection,
          item.noteUrl,
          item.importedAt,
          updatedAt,
        );

      for (const collection of Object.values(store.collections)) {
        collection.itemIds = collection.itemIds.filter(
          (candidateId) => candidateId !== itemId,
        );
      }

      destinationCollection.itemIds = [
        itemId,
        ...destinationCollection.itemIds.filter(
          (candidateId) => candidateId !== itemId,
        ),
      ];
      destinationCollection.updatedAt = updatedAt;
      store.collections[destinationCollectionId] = destinationCollection;

      if (
        previousCollection &&
        previousCollection.id !== destinationCollectionId
      ) {
        previousCollection.updatedAt = updatedAt;
      }

      item.collectionId = destinationCollectionId;
      item.status = targetStatus;
      item.updatedAt = updatedAt;

      return {
        collectionId: destinationCollectionId,
        itemId,
        moved: true,
        source: item.source,
        status: targetStatus,
        updatedAt,
      };
    });
  }

  async rateItem(
    itemId: string,
    rating: ItemRating,
  ): Promise<RateItemResult | null> {
    const updatedAt = new Date().toISOString();

    return this.repository.update((store) => {
      const item = store.items[itemId];
      if (!item) {
        return null;
      }

      item.rating = rating;
      item.updatedAt = updatedAt;

      return {
        itemId,
        rating,
        updatedAt,
      };
    });
  }

  async getDashboard(): Promise<DashboardResponse> {
    const store = await this.repository.read();
    const items = Object.values(store.items);
    const collections = Object.values(store.collections);
    const authors = Object.values(store.authors);
    const statusCounts = createEmptyStatusCounts();

    for (const item of items) {
      statusCounts[item.status] += 1;
    }

    const itemSummaries = [...items]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map<DashboardItemSummary>((item) => {
        const collection = store.collections[item.collectionId];
        const author = item.authorId ? store.authors[item.authorId] : undefined;

        return withoutUndefined({
          id: item.id,
          source: item.source,
          collectionId: item.collectionId,
          collectionTitle: collection?.title ?? 'Unknown collection',
          authorId: item.authorId,
          authorName: author?.name,
          title: item.title,
          noteUrl: item.noteUrl,
          coverUrl: item.coverUrl,
          mediaType: item.mediaType,
          rating: item.rating,
          status: item.status,
          updatedAt: item.updatedAt,
        });
      });
    const recentItems = itemSummaries.slice(0, 25);

    const authorSummaries = authors
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map<DashboardAuthorSummary>((author) => summarizeAuthor(author));

    const collectionSummaries = collections
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map<DashboardCollectionSummary>((collection) => {
        const collectionItems = collection.itemIds
          .map((itemId) => store.items[itemId])
          .filter((item): item is CollectionItemRecord => Boolean(item));

        return withoutUndefined({
          id: collection.id,
          source: collection.source,
          status: collection.status,
          sourceUrl: collection.sourceUrl,
          title: collection.title,
          description: collection.description,
          coverUrl: collection.coverUrl,
          itemCount: collectionItems.length,
          statusCounts: countStatuses(collectionItems),
          updatedAt: collection.updatedAt,
        });
      });

    return withoutUndefined({
      totals: {
        collections: collections.length,
        items: items.length,
        authors: Object.keys(store.authors).length,
      },
      lastImportAt: latestTimestamp(items.map((item) => item.updatedAt)),
      statusCounts,
      items: itemSummaries,
      recentItems,
      authors: authorSummaries,
      collections: collectionSummaries,
    });
  }
}

function summarizeAuthor(author: AuthorRecord): DashboardAuthorSummary {
  return withoutUndefined({
    id: author.id,
    source: author.source,
    name: author.name,
    avatarUrl: author.avatarUrl,
    profileUrl: author.profileUrl,
    updatedAt: author.updatedAt,
  });
}

function createDestinationCollection(
  source: string,
  status: ItemStatus,
  previousCollection: CollectionRecord | undefined,
  fallbackSourceUrl: string,
  importedAt: string,
  updatedAt: string,
): CollectionRecord {
  const collectionId = createDestinationCollectionId(source, status);
  return withoutUndefined({
    id: collectionId,
    source,
    status,
    sourceUrl: previousCollection?.sourceUrl ?? fallbackSourceUrl,
    title: createDestinationCollectionTitle(source, status),
    description: previousCollection?.description,
    coverUrl: previousCollection?.coverUrl,
    itemIds: [],
    importedAt: previousCollection?.importedAt ?? importedAt,
    updatedAt,
    raw: previousCollection?.raw,
  });
}

function countStatuses(items: CollectionItemRecord[]): StatusCounts {
  const counts = createEmptyStatusCounts();
  for (const item of items) {
    counts[item.status] += 1;
  }
  return counts;
}

function latestTimestamp(timestamps: string[]): string | undefined {
  return timestamps.sort((left, right) => right.localeCompare(left))[0];
}

function withoutUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;
}
