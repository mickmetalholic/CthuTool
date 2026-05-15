import * as v from "valibot";

export const itemStatuses = [
  "pending_download",
  "downloaded",
  "not_downloaded",
] as const;

export type ItemStatus = (typeof itemStatuses)[number];

export const itemStatusLabels: Record<ItemStatus, string> = {
  pending_download: "待下载",
  downloaded: "已下载",
  not_downloaded: "不下载",
};

export const itemStatusSchema = v.picklist(itemStatuses);

export const itemMediaTypes = ["image", "video"] as const;

export type ItemMediaType = (typeof itemMediaTypes)[number];

export const itemMediaTypeLabels: Record<ItemMediaType, string> = {
  image: "图文",
  video: "视频",
};

export const itemMediaTypeSchema = v.picklist(itemMediaTypes);

export const itemRatings = ["S", "A", "B"] as const;

export type ItemRating = (typeof itemRatings)[number];

export const itemRatingLabels: Record<ItemRating, string> = {
  S: "S",
  A: "A",
  B: "B",
};

export const itemRatingSchema = v.picklist(itemRatings);

export type DestinationCollection = {
  id: string;
  source: string;
  status: ItemStatus;
  title: string;
};

export function createDestinationCollectionId(
  source: string,
  status: ItemStatus,
): string {
  return `${source}:${status}`;
}

export function createDestinationCollectionTitle(
  source: string,
  status: ItemStatus,
): string {
  return `${source} / ${itemStatusLabels[status]}`;
}

export function createDestinationCollections(
  source: string,
): DestinationCollection[] {
  return itemStatuses.map((status) => ({
    id: createDestinationCollectionId(source, status),
    source,
    status,
    title: createDestinationCollectionTitle(source, status),
  }));
}

export const apiErrorSchema = v.object({
  code: v.string(),
  message: v.string(),
  details: v.optional(v.unknown()),
});

export type ApiError = v.InferOutput<typeof apiErrorSchema>;

export function createApiError(
  code: string,
  message: string,
  details?: unknown,
): ApiError {
  return details === undefined ? { code, message } : { code, message, details };
}

export const authorDraftSchema = v.object({
  id: v.optional(v.string()),
  name: v.string(),
  avatarUrl: v.optional(v.string()),
  profileUrl: v.optional(v.string()),
  raw: v.optional(v.unknown()),
});

export type AuthorDraft = v.InferOutput<typeof authorDraftSchema>;

export const collectionDraftSchema = v.object({
  id: v.optional(v.string()),
  sourceUrl: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  coverUrl: v.optional(v.string()),
  raw: v.optional(v.unknown()),
});

export type CollectionDraft = v.InferOutput<typeof collectionDraftSchema>;

export const itemDraftSchema = v.object({
  id: v.optional(v.string()),
  title: v.string(),
  noteUrl: v.string(),
  coverUrl: v.optional(v.string()),
  mediaType: v.optional(itemMediaTypeSchema),
  author: v.optional(authorDraftSchema),
  raw: v.optional(v.unknown()),
});

export type ItemDraft = v.InferOutput<typeof itemDraftSchema>;

export const importCollectionRequestSchema = v.object({
  source: v.string(),
  status: itemStatusSchema,
  capturedAt: v.string(),
  collection: collectionDraftSchema,
  items: v.array(itemDraftSchema),
});

export type ImportCollectionRequest = v.InferOutput<
  typeof importCollectionRequestSchema
>;

export function parseImportCollectionRequest(input: unknown) {
  return v.safeParse(importCollectionRequestSchema, input);
}

export const deleteItemsRequestSchema = v.object({
  source: v.string(),
  status: itemStatusSchema,
  itemIds: v.array(v.string()),
});

export type DeleteItemsRequest = v.InferOutput<typeof deleteItemsRequestSchema>;

export function parseDeleteItemsRequest(input: unknown) {
  return v.safeParse(deleteItemsRequestSchema, input);
}

export const moveItemRequestSchema = v.object({
  targetStatus: itemStatusSchema,
});

export type MoveItemRequest = v.InferOutput<typeof moveItemRequestSchema>;

export function parseMoveItemRequest(input: unknown) {
  return v.safeParse(moveItemRequestSchema, input);
}

export const rateItemRequestSchema = v.object({
  rating: itemRatingSchema,
});

export type RateItemRequest = v.InferOutput<typeof rateItemRequestSchema>;

export function parseRateItemRequest(input: unknown) {
  return v.safeParse(rateItemRequestSchema, input);
}

export type DeleteItemsSummary = {
  deletedItems: number;
  skippedItems: number;
  itemIds: string[];
  updatedAt: string;
};

export type CollectionRecord = {
  id: string;
  source: string;
  status: ItemStatus;
  sourceUrl: string;
  title: string;
  description?: string;
  coverUrl?: string;
  itemIds: string[];
  importedAt: string;
  updatedAt: string;
  raw?: unknown;
};

export type CollectionItemRecord = {
  id: string;
  source: string;
  collectionId: string;
  authorId?: string;
  title: string;
  noteUrl: string;
  coverUrl?: string;
  mediaType?: ItemMediaType;
  rating?: ItemRating;
  status: ItemStatus;
  importedAt: string;
  updatedAt: string;
  raw?: unknown;
};

export type AuthorRecord = {
  id: string;
  source: string;
  name: string;
  avatarUrl?: string;
  profileUrl?: string;
  updatedAt: string;
  raw?: unknown;
};

export type ImportSummary = {
  collectionId: string;
  createdItems: number;
  updatedItems: number;
  authors: number;
  updatedAt: string;
};

export type StatusCounts = Record<ItemStatus, number>;

export type DashboardCollectionSummary = {
  id: string;
  source: string;
  status: ItemStatus;
  sourceUrl: string;
  title: string;
  description?: string;
  coverUrl?: string;
  itemCount: number;
  statusCounts: StatusCounts;
  updatedAt: string;
};

export type DashboardItemSummary = {
  id: string;
  source: string;
  collectionId: string;
  collectionTitle: string;
  authorId?: string;
  authorName?: string;
  title: string;
  noteUrl: string;
  coverUrl?: string;
  mediaType?: ItemMediaType;
  rating?: ItemRating;
  status: ItemStatus;
  updatedAt: string;
};

export type DashboardAuthorSummary = {
  id: string;
  source: string;
  name: string;
  avatarUrl?: string;
  profileUrl?: string;
  updatedAt: string;
};

export type DashboardResponse = {
  totals: {
    collections: number;
    items: number;
    authors: number;
  };
  lastImportAt?: string;
  statusCounts: StatusCounts;
  items: DashboardItemSummary[];
  recentItems: DashboardItemSummary[];
  authors: DashboardAuthorSummary[];
  collections: DashboardCollectionSummary[];
};

export type CollectionHubStore = {
  collections: Record<string, CollectionRecord>;
  items: Record<string, CollectionItemRecord>;
  authors: Record<string, AuthorRecord>;
};

export function createEmptyStatusCounts(): StatusCounts {
  return {
    pending_download: 0,
    downloaded: 0,
    not_downloaded: 0,
  };
}

export function createEmptyStore(): CollectionHubStore {
  return {
    collections: {},
    items: {},
    authors: {},
  };
}
