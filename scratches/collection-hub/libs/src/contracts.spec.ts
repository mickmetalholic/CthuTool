import { describe, expect, it } from "vitest";

import {
  createApiError,
  createDestinationCollectionId,
  createDestinationCollectionTitle,
  createDestinationCollections,
  itemMediaTypes,
  itemRatingLabels,
  itemRatings,
  itemStatusLabels,
  itemStatuses,
  parseDeleteItemsRequest,
  parseImportCollectionRequest,
  parseMoveItemRequest,
  parseRateItemRequest,
} from "./index";

const validImportRequest = {
  source: "xhs",
  status: "pending_download",
  capturedAt: "2026-05-12T15:30:00.000Z",
  collection: {
    id: "collection-1",
    sourceUrl: "https://example.test/collections/1",
    title: "Saved notes",
    coverUrl: "https://example.test/cover.jpg",
  },
  items: [
    {
      id: "note-1",
      title: "First note",
      noteUrl: "https://example.test/notes/1",
      coverUrl: "https://example.test/notes/1.jpg",
      mediaType: "video",
      author: {
        id: "author-1",
        name: "Alice",
        avatarUrl: "https://example.test/alice.jpg",
        profileUrl: "https://example.test/users/alice",
      },
    },
  ],
};

describe("shared Collection Hub contracts", () => {
  it("defines the stable item status values and Chinese labels", () => {
    expect(itemStatuses).toEqual([
      "pending_download",
      "downloaded",
      "not_downloaded",
    ]);
    expect(itemStatusLabels).toEqual({
      pending_download: "待下载",
      downloaded: "已下载",
      not_downloaded: "不下载",
    });
  });

  it("derives fixed destination collections for a source", () => {
    expect(createDestinationCollectionId("xhs", "pending_download")).toBe(
      "xhs:pending_download",
    );
    expect(createDestinationCollectionTitle("xhs", "not_downloaded")).toBe(
      "xhs / 不下载",
    );
    expect(createDestinationCollections("xhs")).toEqual([
      {
        id: "xhs:pending_download",
        source: "xhs",
        status: "pending_download",
        title: "xhs / 待下载",
      },
      {
        id: "xhs:downloaded",
        source: "xhs",
        status: "downloaded",
        title: "xhs / 已下载",
      },
      {
        id: "xhs:not_downloaded",
        source: "xhs",
        status: "not_downloaded",
        title: "xhs / 不下载",
      },
    ]);
  });

  it("defines supported item media types", () => {
    expect(itemMediaTypes).toEqual(["image", "video"]);
  });

  it("defines supported item rating values and labels", () => {
    expect(itemRatings).toEqual(["S", "A", "B"]);
    expect(itemRatingLabels).toEqual({
      S: "S",
      A: "A",
      B: "B",
    });
  });

  it("parses a valid collection import request", () => {
    const result = parseImportCollectionRequest(validImportRequest);

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error("expected valid import request");
    }
    expect(result.output.source).toBe("xhs");
    expect(result.output.status).toBe("pending_download");
    expect(result.output.items[0]?.mediaType).toBe("video");
    expect(result.output.items[0]?.author?.name).toBe("Alice");
  });

  it("rejects an import request with an invalid status", () => {
    const result = parseImportCollectionRequest({
      ...validImportRequest,
      status: "maybe_later",
    });

    expect(result.success).toBe(false);
  });

  it("parses a valid status-scoped delete request", () => {
    const result = parseDeleteItemsRequest({
      source: "xhs",
      status: "downloaded",
      itemIds: ["note-1", "note-2"],
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error("expected valid delete request");
    }
    expect(result.output.itemIds).toEqual(["note-1", "note-2"]);
  });

  it("rejects a delete request with an invalid status", () => {
    const result = parseDeleteItemsRequest({
      source: "xhs",
      status: "maybe_later",
      itemIds: ["note-1"],
    });

    expect(result.success).toBe(false);
  });

  it("parses a valid move item request", () => {
    const result = parseMoveItemRequest({
      targetStatus: "downloaded",
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error("expected valid move request");
    }
    expect(result.output.targetStatus).toBe("downloaded");
  });

  it("rejects a move item request with an invalid target status", () => {
    const result = parseMoveItemRequest({
      targetStatus: "maybe_later",
    });

    expect(result.success).toBe(false);
  });

  it("parses a valid item rating request", () => {
    const result = parseRateItemRequest({
      rating: "S",
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error("expected valid rating request");
    }
    expect(result.output.rating).toBe("S");
  });

  it("rejects an item rating request with an invalid rating", () => {
    const result = parseRateItemRequest({
      rating: "C",
    });

    expect(result.success).toBe(false);
  });

  it("creates structured API errors", () => {
    expect(createApiError("VALIDATION_ERROR", "Invalid payload")).toEqual({
      code: "VALIDATION_ERROR",
      message: "Invalid payload",
    });
  });
});
