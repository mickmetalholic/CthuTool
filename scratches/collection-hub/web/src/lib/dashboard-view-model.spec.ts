import { describe, expect, it } from "vitest";

import type { DashboardResponse } from "@collection-hub/libs";

import {
  createAuthorSummaries,
  createDashboardNavigation,
  filterItemsByStatus,
  formatLastImportAt,
  getAuthorDetail,
  getDashboardSelection,
  isDashboardEmpty,
} from "./dashboard-view-model";

const dashboard: DashboardResponse = {
  totals: {
    collections: 1,
    items: 2,
    authors: 1,
  },
  lastImportAt: "2026-05-12T15:30:00.000Z",
  statusCounts: {
    pending_download: 1,
    downloaded: 1,
    not_downloaded: 0,
  },
  items: [
    {
      id: "note-1",
      source: "xhs",
      collectionId: "xhs:pending_download",
      collectionTitle: "xhs / 待下载",
      authorId: "author-1",
      authorName: "Alice",
      title: "First note",
      noteUrl: "https://example.test/notes/1",
      status: "pending_download",
      updatedAt: "2026-05-12T15:30:00.000Z",
    },
    {
      id: "note-2",
      source: "xhs",
      collectionId: "xhs:downloaded",
      collectionTitle: "xhs / 已下载",
      authorId: "author-2",
      authorName: "Bob",
      title: "Second note",
      noteUrl: "https://example.test/notes/2",
      rating: "S",
      status: "downloaded",
      updatedAt: "2026-05-12T15:31:00.000Z",
    },
    {
      id: "note-3",
      source: "xhs",
      collectionId: "xhs:downloaded",
      collectionTitle: "xhs / 已下载",
      authorId: "author-1",
      authorName: "Alice",
      title: "Third note",
      noteUrl: "https://example.test/notes/3",
      rating: "B",
      status: "downloaded",
      updatedAt: "2026-05-12T15:32:00.000Z",
    },
  ],
  recentItems: [],
  authors: [
    {
      id: "author-1",
      source: "xhs",
      name: "Alice",
      avatarUrl: "https://example.test/alice.jpg",
      profileUrl: "https://example.test/users/alice",
      updatedAt: "2026-05-12T15:30:00.000Z",
    },
    {
      id: "author-2",
      source: "xhs",
      name: "Bob",
      avatarUrl: "https://example.test/bob.jpg",
      profileUrl: "https://example.test/users/bob",
      updatedAt: "2026-05-12T15:31:00.000Z",
    },
  ],
  collections: [
    {
      id: "xhs:pending_download",
      source: "xhs",
      status: "pending_download",
      sourceUrl: "https://example.test/collections/1",
      title: "xhs / 待下载",
      itemCount: 1,
      statusCounts: {
        pending_download: 1,
        downloaded: 0,
        not_downloaded: 0,
      },
      updatedAt: "2026-05-12T15:30:00.000Z",
    },
    {
      id: "xhs:downloaded",
      source: "xhs",
      status: "downloaded",
      sourceUrl: "https://example.test/collections/1",
      title: "xhs / 已下载",
      itemCount: 1,
      statusCounts: {
        pending_download: 0,
        downloaded: 1,
        not_downloaded: 0,
      },
      updatedAt: "2026-05-12T15:31:00.000Z",
    },
  ],
};

describe("dashboard view model", () => {
  it("detects empty dashboard responses", () => {
    expect(isDashboardEmpty({ ...dashboard, totals: { collections: 0, items: 0, authors: 0 } })).toBe(
      true,
    );
    expect(isDashboardEmpty(dashboard)).toBe(false);
  });

  it("filters recent items by status", () => {
    expect(filterItemsByStatus(dashboard.items, "all")).toHaveLength(3);
    expect(filterItemsByStatus(dashboard.items, "pending_download")).toEqual([
      dashboard.items[0],
    ]);
  });

  it("builds the xhs navigation group with three collections and authors", () => {
    expect(createDashboardNavigation(dashboard)).toEqual([
      {
        source: "xhs",
        label: "xhs",
        entries: [
          {
            count: 1,
            id: "xhs:pending_download",
            label: "待下载",
            ratingCounts: {
              A: 0,
              B: 0,
              S: 0,
              unrated: 1,
            },
            source: "xhs",
            status: "pending_download",
            type: "collection",
          },
          {
            count: 1,
            id: "xhs:downloaded",
            label: "已下载",
            ratingCounts: {
              A: 0,
              B: 1,
              S: 1,
              unrated: 0,
            },
            source: "xhs",
            status: "downloaded",
            type: "collection",
          },
          {
            count: 0,
            id: "xhs:not_downloaded",
            label: "不下载",
            ratingCounts: {
              A: 0,
              B: 0,
              S: 0,
              unrated: 0,
            },
            source: "xhs",
            status: "not_downloaded",
            type: "collection",
          },
          {
            count: 2,
            id: "xhs:authors",
            label: "作者",
            source: "xhs",
            type: "authors",
          },
        ],
      },
    ]);
  });

  it("selects the right-side item or author list from navigation", () => {
    expect(
      getDashboardSelection(dashboard, {
        source: "xhs",
        ratingFilter: "unrated",
        status: "pending_download",
        type: "collection",
      }),
    ).toMatchObject({
      title: "待下载 / 未评级",
      items: [dashboard.items[0]],
      authors: [],
    });
    expect(
      getDashboardSelection(dashboard, {
        source: "xhs",
        ratingFilter: "S",
        status: "downloaded",
        type: "collection",
      }),
    ).toMatchObject({
      title: "已下载 / S",
      items: [dashboard.items[1]],
      authors: [],
    });
    expect(
      getDashboardSelection(dashboard, {
        source: "xhs",
        type: "authors",
      }),
    ).toMatchObject({
      title: "作者",
      items: [],
      authors: dashboard.authors,
    });
  });

  it("returns empty content for reserved sources before they have imports", () => {
    expect(
      getDashboardSelection(dashboard, {
        source: "bilibili",
        ratingFilter: "unrated",
        status: "pending_download",
        type: "collection",
      }),
    ).toMatchObject({
      title: "待下载 / 未评级",
      items: [],
      authors: [],
    });

    expect(
      getDashboardSelection(dashboard, {
        source: "ins",
        type: "authors",
      }),
    ).toMatchObject({
      title: "作者",
      items: [],
      authors: [],
    });
  });

  it("sorts authors by imported note count", () => {
    expect(createAuthorSummaries(dashboard, "xhs").map((author) => ({
      id: author.id,
      noteCount: author.noteCount,
    }))).toEqual([
      { id: "author-1", noteCount: 2 },
      { id: "author-2", noteCount: 1 },
    ]);
  });

  it("returns author detail with all imported notes", () => {
    expect(getAuthorDetail(dashboard, "author-1")).toMatchObject({
      author: {
        id: "author-1",
        name: "Alice",
        noteCount: 2,
      },
      items: [dashboard.items[2], dashboard.items[0]],
    });
    expect(getAuthorDetail(dashboard, "missing-author")).toBeNull();
  });

  it("formats the last import timestamp fallback", () => {
    expect(formatLastImportAt(undefined)).toBe("尚未导入");
    expect(formatLastImportAt(dashboard.lastImportAt)).toContain("2026");
  });
});
