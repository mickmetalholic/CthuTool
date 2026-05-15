import type {
  DashboardAuthorSummary,
  DashboardItemSummary,
  DashboardResponse,
  ItemRating,
  ItemStatus,
} from "@collection-hub/libs";
import {
  itemRatingLabels,
  itemRatings,
  itemStatusLabels,
  itemStatuses,
} from "@collection-hub/libs";

export type StatusFilter = ItemStatus | "all";
export type RatingFilter = ItemRating | "unrated";
export type RatingCounts = Record<RatingFilter, number>;
export type DashboardNavigationSelection =
  | {
      ratingFilter: RatingFilter;
      source: string;
      status: ItemStatus;
      type: "collection";
    }
  | {
      source: string;
      type: "authors";
    };

export type DashboardNavigationEntry =
  | {
      count: number;
      id: string;
      label: string;
      ratingCounts: RatingCounts;
      source: string;
      status: ItemStatus;
      type: "collection";
    }
  | {
      count: number;
      id: string;
      label: string;
      source: string;
      type: "authors";
    };

export type DashboardNavigationGroup = {
  entries: DashboardNavigationEntry[];
  label: string;
  source: string;
};

export type DashboardSelection = {
  authors: DashboardAuthorSummary[];
  items: DashboardItemSummary[];
  title: string;
};

export type DashboardAuthorWithNotes = DashboardAuthorSummary & {
  latestUpdatedAt?: string;
  noteCount: number;
};

export type DashboardAuthorDetail = {
  author: DashboardAuthorWithNotes;
  items: DashboardItemSummary[];
};

export const dashboardSource = "xhs";

export const ratingFilters = [...itemRatings, "unrated"] as const;

export const ratingFilterLabels: Record<RatingFilter, string> = {
  ...itemRatingLabels,
  unrated: "未评级",
};

export function isDashboardEmpty(dashboard: DashboardResponse): boolean {
  return dashboard.totals.collections === 0 && dashboard.totals.items === 0;
}

export function filterItemsByStatus(
  items: DashboardItemSummary[],
  status: StatusFilter,
): DashboardItemSummary[] {
  if (status === "all") {
    return items;
  }
  return items.filter((item) => item.status === status);
}

export function createDashboardNavigation(
  dashboard: DashboardResponse,
): DashboardNavigationGroup[] {
  const source = dashboardSource;
  const entries: DashboardNavigationEntry[] = itemStatuses.map((status) => {
    const collectionId = `${source}:${status}`;
    const collection = dashboard.collections.find(
      (candidate) => candidate.source === source && candidate.status === status,
    );
    const collectionItems = dashboard.items.filter(
      (item) => item.source === source && item.collectionId === collectionId,
    );

    return {
      count: collection?.itemCount ?? 0,
      id: collectionId,
      label: itemStatusLabels[status],
      ratingCounts: countRatingFilters(collectionItems),
      source,
      status,
      type: "collection",
    };
  });

  entries.push({
    count: dashboard.authors.filter((author) => author.source === source).length,
    id: `${source}:authors`,
    label: "作者",
    source,
    type: "authors",
  });

  return [
    {
      entries,
      label: source,
      source,
    },
  ];
}

export function getDashboardSelection(
  dashboard: DashboardResponse,
  selection: DashboardNavigationSelection,
): DashboardSelection {
  if (selection.type === "authors") {
    return {
      authors: dashboard.authors.filter(
        (author) => author.source === selection.source,
      ),
      items: [],
      title: "作者",
    };
  }

  return {
    authors: [],
    items: dashboard.items.filter((item) => {
      return (
        item.source === selection.source &&
        item.collectionId === `${selection.source}:${selection.status}` &&
        matchesRatingFilter(item, selection.ratingFilter)
      );
    }),
    title: `${itemStatusLabels[selection.status]} / ${
      ratingFilterLabels[selection.ratingFilter]
    }`,
  };
}

export function createAuthorSummaries(
  dashboard: DashboardResponse,
  source: string,
): DashboardAuthorWithNotes[] {
  return dashboard.authors
    .filter((author) => author.source === source)
    .map((author) => {
      const authorItems = getItemsForAuthor(dashboard.items, author.id);

      return {
        ...author,
        latestUpdatedAt: authorItems[0]?.updatedAt ?? author.updatedAt,
        noteCount: authorItems.length,
      };
    })
    .sort((left, right) => {
      if (right.noteCount !== left.noteCount) {
        return right.noteCount - left.noteCount;
      }
      return (
        new Date(right.latestUpdatedAt ?? right.updatedAt).getTime() -
        new Date(left.latestUpdatedAt ?? left.updatedAt).getTime()
      );
    });
}

export function getAuthorDetail(
  dashboard: DashboardResponse,
  authorId: string | null,
  source = dashboardSource,
): DashboardAuthorDetail | null {
  if (!authorId) {
    return null;
  }

  const author = createAuthorSummaries(dashboard, source).find(
    (candidate) => candidate.id === authorId,
  );

  if (!author) {
    return null;
  }

  return {
    author,
    items: getItemsForAuthor(dashboard.items, authorId),
  };
}

function getItemsForAuthor(
  items: DashboardItemSummary[],
  authorId: string,
): DashboardItemSummary[] {
  return items
    .filter((item) => item.authorId === authorId)
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );
}

function countRatingFilters(items: DashboardItemSummary[]): RatingCounts {
  const counts = createEmptyRatingCounts();

  for (const item of items) {
    if (item.rating) {
      counts[item.rating] += 1;
    } else {
      counts.unrated += 1;
    }
  }

  return counts;
}

function createEmptyRatingCounts(): RatingCounts {
  return {
    A: 0,
    B: 0,
    S: 0,
    unrated: 0,
  };
}

function matchesRatingFilter(
  item: DashboardItemSummary,
  ratingFilter: RatingFilter,
): boolean {
  if (ratingFilter === "unrated") {
    return item.rating === undefined;
  }
  return item.rating === ratingFilter;
}

export function formatLastImportAt(timestamp?: string): string {
  if (!timestamp) {
    return "尚未导入";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}
