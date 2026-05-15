"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleSlash2,
  Download,
  ExternalLink,
  FileImage,
  Film,
  FolderInput,
  ImageIcon,
  Loader2,
  Trash2,
  Users,
} from "lucide-react";

import {
  itemRatingLabels,
  itemRatings,
  itemStatusLabels,
  itemStatuses,
  type DashboardItemSummary,
  type DashboardResponse,
  type ItemRating,
  type ItemStatus,
} from "@collection-hub/libs";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  createAuthorSummaries,
  createDashboardNavigation,
  dashboardSource,
  getAuthorDetail,
  getDashboardSelection,
  ratingFilterLabels,
  ratingFilters,
  type DashboardAuthorDetail,
  type DashboardAuthorWithNotes,
  type DashboardNavigationEntry,
  type DashboardNavigationGroup,
  type DashboardNavigationSelection,
  type RatingFilter,
} from "@/lib/dashboard-view-model";
import bilibiliIcon from "../../assets/bilibili.png";
import instagramIcon from "../../assets/instagram.webp";
import xiaohongshuIcon from "../../assets/xiaohongshu.ico";

type DashboardClientProps = {
  apiBaseUrl: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; dashboard: DashboardResponse };

type DeleteState =
  | { itemId: string; status: "deleting" }
  | { message: string; status: "error" }
  | { status: "idle" };

type MoveState =
  | { itemId: string; status: "moving"; targetStatus: ItemStatus }
  | { message: string; status: "error" }
  | { status: "idle" };

type RatingState =
  | { itemId: string; rating: ItemRating; status: "rating" }
  | { message: string; status: "error" }
  | { status: "idle" };

const defaultSelection: DashboardNavigationSelection = {
  ratingFilter: "unrated",
  source: dashboardSource,
  status: "pending_download",
  type: "collection",
};

const statusTone: Record<ItemStatus, string> = {
  downloaded: "border-emerald-300/35 bg-emerald-400/10 text-emerald-100",
  not_downloaded: "border-rose-300/35 bg-rose-400/10 text-rose-100",
  pending_download: "border-cyan-300/35 bg-cyan-400/10 text-cyan-100",
};

const ratingTone: Record<ItemRating, string> = {
  A: "border-sky-300/45 bg-sky-400/15 text-sky-50 shadow-sky-950/25",
  B: "border-emerald-300/45 bg-emerald-400/15 text-emerald-50 shadow-emerald-950/25",
  S: "border-fuchsia-300/50 bg-fuchsia-400/20 text-fuchsia-50 shadow-fuchsia-950/30",
};

const sourceNavigation = [
  {
    iconSrc: xiaohongshuIcon.src,
    label: "XHS",
    source: "xhs",
  },
  {
    iconSrc: bilibiliIcon.src,
    label: "Bilibili",
    source: "bilibili",
  },
  {
    iconSrc: instagramIcon.src,
    label: "INS",
    source: "ins",
  },
] as const;

const initialVisibleItemCount = 60;
const visibleItemIncrement = 60;

export default function DashboardClient({ apiBaseUrl }: DashboardClientProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [deleteState, setDeleteState] = useState<DeleteState>({ status: "idle" });
  const [moveState, setMoveState] = useState<MoveState>({ status: "idle" });
  const [ratingState, setRatingState] = useState<RatingState>({
    status: "idle",
  });
  const [pendingDeleteItem, setPendingDeleteItem] =
    useState<DashboardItemSummary | null>(null);
  const [selection, setSelection] =
    useState<DashboardNavigationSelection>(defaultSelection);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setState({ status: "loading" });
      try {
        setState({
          status: "ready",
          dashboard: await fetchDashboard(apiBaseUrl, controller.signal),
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "API unavailable",
        });
      }
    }

    void load();
    return () => controller.abort();
  }, [apiBaseUrl]);

  const dashboard = state.status === "ready" ? state.dashboard : null;
  const navigation = useMemo(
    () => (dashboard ? createDashboardNavigation(dashboard) : []),
    [dashboard],
  );
  const selectedContent = useMemo(
    () => (dashboard ? getDashboardSelection(dashboard, selection) : null),
    [dashboard, selection],
  );
  const authors = useMemo(
    () => (dashboard ? createAuthorSummaries(dashboard, selection.source) : []),
    [dashboard, selection.source],
  );
  const authorsById = useMemo(
    () => new Map(authors.map((author) => [author.id, author])),
    [authors],
  );
  const activeAuthorId = useMemo(() => {
    if (!selectedAuthorId) {
      return authors[0]?.id ?? null;
    }
    return authors.some((author) => author.id === selectedAuthorId)
      ? selectedAuthorId
      : authors[0]?.id ?? null;
  }, [authors, selectedAuthorId]);

  const authorDetail = useMemo(
    () =>
      dashboard
        ? getAuthorDetail(
            dashboard,
            activeAuthorId,
            selection.source,
          )
        : null,
    [activeAuthorId, dashboard, selection.source],
  );

  const selectedTitle =
    selection.type === "authors" ? "作者" : selectedContent?.title ?? "收藏夹";
  const actionError =
    deleteState.status === "error"
      ? deleteState.message
      : moveState.status === "error"
        ? moveState.message
        : ratingState.status === "error"
          ? ratingState.message
          : null;

  function handleNavigationSelect(nextSelection: DashboardNavigationSelection) {
    setSelection(nextSelection);
  }

  function handleAuthorFromItem(item: DashboardItemSummary) {
    if (!item.authorId) {
      return;
    }
    setSelectedAuthorId(item.authorId);
    setSelection({ source: item.source, type: "authors" });
  }

  function handleDeleteRequest(item: DashboardItemSummary) {
    if (deleteState.status === "deleting") {
      return;
    }

    setDeleteState({ status: "idle" });
    setPendingDeleteItem(item);
  }

  async function handleDeleteItem(item: DashboardItemSummary) {
    setDeleteState({ itemId: item.id, status: "deleting" });
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/dashboard/items/${encodeURIComponent(item.id)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      setState({
        status: "ready",
        dashboard: await fetchDashboard(apiBaseUrl),
      });
      setDeleteState({ status: "idle" });
      setPendingDeleteItem(null);
    } catch (error) {
      setDeleteState({
        message: error instanceof Error ? error.message : "删除失败",
        status: "error",
      });
    }
  }

  async function handleMoveItem(
    item: DashboardItemSummary,
    targetStatus: ItemStatus,
  ) {
    if (item.status === targetStatus) {
      return;
    }

    setMoveState({ itemId: item.id, status: "moving", targetStatus });
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/dashboard/items/${encodeURIComponent(item.id)}/move`,
        {
          body: JSON.stringify({ targetStatus }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      setState({
        status: "ready",
        dashboard: await fetchDashboard(apiBaseUrl),
      });
      setMoveState({ status: "idle" });
    } catch (error) {
      setMoveState({
        message: error instanceof Error ? error.message : "移动失败",
        status: "error",
      });
    }
  }

  async function handleRateItem(item: DashboardItemSummary, rating: ItemRating) {
    if (item.rating === rating) {
      return;
    }

    setRatingState({ itemId: item.id, rating, status: "rating" });
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/dashboard/items/${encodeURIComponent(item.id)}/rating`,
        {
          body: JSON.stringify({ rating }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      setState({
        status: "ready",
        dashboard: await fetchDashboard(apiBaseUrl),
      });
      setRatingState({ status: "idle" });
    } catch (error) {
      setRatingState({
        message: error instanceof Error ? error.message : "评级失败",
        status: "error",
      });
    }
  }

  return (
      <main className="h-screen overflow-hidden bg-[#070910] text-slate-100">
        <div className="flex h-full min-h-0 flex-col gap-4 p-4 md:p-5">
          {state.status === "loading" ? <LoadingState /> : null}
          {state.status === "error" ? <ErrorState message={state.message} /> : null}

          {dashboard && selectedContent ? (
            <section className="grid min-h-0 flex-1 overflow-hidden rounded-lg border border-white/10 bg-[#0b101b] shadow-2xl shadow-black/30 lg:grid-cols-[296px_minmax(0,1fr)]">
              <aside className="min-h-0 overflow-hidden border-b border-white/10 bg-[#080c15] lg:border-b-0 lg:border-r">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <NavigationSidebar
                      groups={navigation}
                      onSelect={handleNavigationSelect}
                      selection={selection}
                    />
                  </div>
                </ScrollArea>
              </aside>

              <section className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#0c111d]">
                <div className="shrink-0 border-b border-white/10 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-white">
                        {selectedTitle}
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        {selection.type === "authors"
                          ? "按已导入笔记数量排序"
                          : "点击封面打开源笔记，点击作者定位到作者列表"}
                      </p>
                      {actionError ? (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-200">
                          <AlertCircle className="size-3.5 shrink-0" />
                          {actionError}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-hidden">
                  {selection.type === "authors" ? (
                    <AuthorExplorer
                      authors={authors}
                      deleteState={deleteState}
                      detail={authorDetail}
                      moveState={moveState}
                      onDeleteItem={handleDeleteRequest}
                      onMoveItem={handleMoveItem}
                      onRateItem={handleRateItem}
                      ratingState={ratingState}
                      onSelectAuthor={setSelectedAuthorId}
                      selectedAuthorId={activeAuthorId}
                    />
                  ) : (
                    <ItemGrid
                      authorsById={authorsById}
                      deleteState={deleteState}
                      items={selectedContent.items}
                      moveState={moveState}
                      onDeleteItem={handleDeleteRequest}
                      onMoveItem={handleMoveItem}
                      onAuthorSelect={handleAuthorFromItem}
                      onRateItem={handleRateItem}
                      ratingState={ratingState}
                    />
                  )}
                </div>
              </section>
            </section>
          ) : null}
          <DeleteConfirmDialog
            deleteState={deleteState}
            item={pendingDeleteItem}
            onCancel={() => setPendingDeleteItem(null)}
            onConfirm={() => {
              if (pendingDeleteItem) {
                void handleDeleteItem(pendingDeleteItem);
              }
            }}
          />
        </div>
      </main>
  );
}

function createPlaceholderNavigationGroup(
  source: string,
  label: string,
): DashboardNavigationGroup {
  return {
    entries: [
      {
        count: 0,
        id: `${source}:pending_download`,
        label: itemStatusLabels.pending_download,
        ratingCounts: createEmptyNavigationRatingCounts(),
        source,
        status: "pending_download" as ItemStatus,
        type: "collection",
      },
      {
        count: 0,
        id: `${source}:downloaded`,
        label: itemStatusLabels.downloaded,
        ratingCounts: createEmptyNavigationRatingCounts(),
        source,
        status: "downloaded" as ItemStatus,
        type: "collection",
      },
      {
        count: 0,
        id: `${source}:not_downloaded`,
        label: itemStatusLabels.not_downloaded,
        ratingCounts: createEmptyNavigationRatingCounts(),
        source,
        status: "not_downloaded" as ItemStatus,
        type: "collection",
      },
      {
        count: 0,
        id: `${source}:authors`,
        label: "作者",
        source,
        type: "authors",
      },
    ],
    label,
    source,
  };
}

function createEmptyNavigationRatingCounts() {
  return {
    A: 0,
    B: 0,
    S: 0,
    unrated: 0,
  };
}

type CollectionNavigationEntry = Extract<
  DashboardNavigationEntry,
  { type: "collection" }
>;

type AuthorsNavigationEntry = Extract<
  DashboardNavigationEntry,
  { type: "authors" }
>;

function NavigationSidebar({
  groups,
  onSelect,
  selection,
}: {
  groups: DashboardNavigationGroup[];
  onSelect: (selection: DashboardNavigationSelection) => void;
  selection: DashboardNavigationSelection;
}) {
  const groupBySource = new Map(groups.map((group) => [group.source, group]));
  const [expandedCollectionIds, setExpandedCollectionIds] = useState(
    () => new Set([`${dashboardSource}:pending_download`]),
  );

  function handleToggleCollection(entry: CollectionNavigationEntry) {
    setExpandedCollectionIds((current) => {
      const next = new Set(current);
      if (next.has(entry.id)) {
        next.delete(entry.id);
      } else {
        next.add(entry.id);
      }
      return next;
    });
  }

  return (
    <div className="grid gap-3">
      {sourceNavigation.map((sourceMeta) => {
        const group =
          groupBySource.get(sourceMeta.source) ??
          createPlaceholderNavigationGroup(sourceMeta.source, sourceMeta.label);
        const collectionEntries = group.entries.filter(
          (entry): entry is CollectionNavigationEntry => entry.type === "collection",
        );
        const authorsEntry = group.entries.find(
          (entry): entry is AuthorsNavigationEntry => entry.type === "authors",
        );

        return (
          <section
            className={cn(
              "app-interactive rounded-lg border p-2",
              selection.source === group.source
                ? "border-cyan-300/22 bg-cyan-300/[0.045]"
                : "border-white/8 bg-white/[0.025]",
            )}
            key={group.source}
          >
            <div className="mb-2 flex items-center gap-2 px-1.5 py-1">
              <img
                alt=""
                className="size-5 shrink-0 rounded-md border border-white/10 bg-white/10"
                src={sourceMeta.iconSrc}
              />
              <p className="truncate text-sm font-semibold text-slate-200">
                {sourceMeta.label}
              </p>
            </div>
            <nav aria-label={`${group.label} 导航`} className="grid gap-1.5">
              {collectionEntries.map((entry) => (
                <CollectionNavigationSection
                  entry={entry}
                  expanded={expandedCollectionIds.has(entry.id)}
                  key={entry.id}
                  onSelect={onSelect}
                  onToggle={handleToggleCollection}
                  selection={selection}
                />
              ))}

              {authorsEntry ? (
                <div className="mt-1 border-t border-white/8 pt-1.5">
                  <NavigationButton
                    active={isSelected(selection, authorsEntry)}
                    entry={authorsEntry}
                    onSelect={onSelect}
                  />
                </div>
              ) : null}
            </nav>
          </section>
        );
      })}
    </div>
  );
}

function CollectionNavigationSection({
  entry,
  expanded,
  onSelect,
  onToggle,
  selection,
}: {
  entry: CollectionNavigationEntry;
  expanded: boolean;
  onSelect: (selection: DashboardNavigationSelection) => void;
  onToggle: (entry: CollectionNavigationEntry) => void;
  selection: DashboardNavigationSelection;
}) {
  const active = isCollectionSelected(selection, entry);
  const ratingListId = `collection-rating-filter-${entry.id}`;

  return (
    <div className="grid gap-1">
      <button
        aria-controls={ratingListId}
        aria-expanded={expanded}
        aria-label={`${entry.label} 收藏夹，${expanded ? "折叠" : "展开"}`}
        className={cn(
          "flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm font-semibold outline-none",
          "app-interactive app-focus-ring active:translate-y-px",
          getNavigationButtonTone(entry, active, false),
        )}
        onClick={() => onToggle(entry)}
        type="button"
      >
        <span className="flex min-w-0 items-center gap-2">
          {expanded ? (
            <ChevronDown className="size-4 shrink-0 text-slate-400" />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-slate-400" />
          )}
          <CollectionIcon className="size-4 shrink-0" status={entry.status} />
          <span className="truncate">{entry.label}</span>
        </span>
        <Badge
          className={cn(
            "h-6 border px-2",
            active
              ? "border-white/15 bg-white/10 text-white"
              : "border-white/10 bg-black/20 text-slate-400",
          )}
          variant="outline"
        >
          {entry.count}
        </Badge>
      </button>

      {expanded ? (
        <div
          className="ml-4 grid gap-1 border-l border-white/10 pl-2"
          id={ratingListId}
        >
          {ratingFilters.map((ratingFilter) => (
            <RatingFilterNavigationButton
              active={isRatingFilterSelected(selection, entry, ratingFilter)}
              entry={entry}
              key={ratingFilter}
              onSelect={onSelect}
              ratingFilter={ratingFilter}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RatingFilterNavigationButton({
  active,
  entry,
  onSelect,
  ratingFilter,
}: {
  active: boolean;
  entry: CollectionNavigationEntry;
  onSelect: (selection: DashboardNavigationSelection) => void;
  ratingFilter: RatingFilter;
}) {
  return (
    <button
      aria-current={active ? "page" : undefined}
      aria-label={`${entry.label} / ${ratingFilterLabels[ratingFilter]}`}
      className={cn(
        "flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs font-semibold outline-none",
        "app-interactive app-focus-ring active:translate-y-px",
        getRatingFilterButtonTone(ratingFilter, active),
      )}
      onClick={() =>
        onSelect({
          ratingFilter,
          source: entry.source,
          status: entry.status,
          type: "collection",
        })
      }
      type="button"
    >
      <span className="flex min-w-0 items-center gap-2">
        <RatingFilterMark active={active} ratingFilter={ratingFilter} />
        <span className="truncate">{ratingFilterLabels[ratingFilter]}</span>
      </span>
      <Badge
        className={cn(
          "h-5 border px-1.5 text-[11px]",
          active
            ? "border-white/15 bg-white/10 text-white"
            : "border-white/10 bg-black/15 text-slate-500",
        )}
        variant="outline"
      >
        {entry.ratingCounts[ratingFilter]}
      </Badge>
    </button>
  );
}

function RatingFilterMark({
  active,
  ratingFilter,
}: {
  active: boolean;
  ratingFilter: RatingFilter;
}) {
  if (ratingFilter === "unrated") {
    return (
      <span
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-black",
          active
            ? "border-slate-200/30 bg-slate-200/15 text-slate-50"
            : "border-white/10 bg-white/[0.04] text-slate-500",
        )}
      >
        ?
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-black",
        active
          ? ratingTone[ratingFilter]
          : "border-white/10 bg-white/[0.04] text-slate-500",
      )}
    >
      {itemRatingLabels[ratingFilter]}
    </span>
  );
}

function NavigationButton({
  active,
  disabled = false,
  entry,
  onSelect,
}: {
  active: boolean;
  disabled?: boolean;
  entry: DashboardNavigationEntry;
  onSelect: (selection: DashboardNavigationSelection) => void;
}) {
  const selection =
    entry.type === "authors"
      ? { source: entry.source, type: "authors" as const }
      : {
          ratingFilter: "unrated" as const,
          source: entry.source,
          status: entry.status,
          type: "collection" as const,
        };
  return (
    <button
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm font-semibold outline-none",
        !disabled && "app-interactive app-focus-ring active:translate-y-px",
        getNavigationButtonTone(entry, active, disabled),
      )}
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onSelect(selection);
        }
      }}
      type="button"
    >
      <span className="flex min-w-0 items-center gap-2">
        <NavigationEntryIcon className="size-4 shrink-0" entry={entry} />
        <span className="truncate">{entry.label}</span>
      </span>
      <Badge
        className={cn(
          "h-6 border px-2",
          disabled
            ? "border-white/5 bg-black/10 text-slate-600"
            : active
            ? "border-white/15 bg-white/10 text-white"
            : "border-white/10 bg-black/20 text-slate-400",
        )}
        variant="outline"
      >
        {entry.count}
      </Badge>
    </button>
  );
}

function getNavigationButtonTone(
  entry: DashboardNavigationEntry,
  active: boolean,
  disabled: boolean,
) {
  if (disabled) {
    return "cursor-not-allowed border-white/5 bg-white/[0.02] text-slate-600";
  }

  if (entry.type === "authors") {
    return active
      ? "border-fuchsia-300/45 bg-fuchsia-400/15 text-fuchsia-50 shadow-lg shadow-fuchsia-950/30 hover:border-fuchsia-300/60 hover:bg-fuchsia-400/[0.18] hover:shadow-fuchsia-950/40"
      : "border-fuchsia-300/10 bg-fuchsia-400/5 text-slate-300 hover:border-fuchsia-300/35 hover:bg-fuchsia-400/10 hover:text-fuchsia-50";
  }

  return active
    ? cn(
        statusTone[entry.status],
        "shadow-lg shadow-black/20 hover:border-white/25 hover:brightness-110 hover:shadow-cyan-950/25",
      )
    : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-cyan-300/35 hover:bg-white/[0.07] hover:text-white";
}

function getRatingFilterButtonTone(
  ratingFilter: RatingFilter,
  active: boolean,
) {
  if (active) {
    return ratingFilter === "unrated"
      ? "border-slate-300/30 bg-slate-300/10 text-slate-50 shadow-sm shadow-black/20 hover:border-slate-200/40 hover:bg-slate-200/15"
      : cn(
          ratingTone[ratingFilter],
          "shadow-sm hover:border-white/25 hover:brightness-110",
        );
  }

  return ratingFilter === "unrated"
    ? "border-white/8 bg-white/[0.025] text-slate-400 hover:border-slate-300/25 hover:bg-white/[0.06] hover:text-slate-100"
    : "border-white/8 bg-white/[0.025] text-slate-400 hover:border-cyan-300/25 hover:bg-white/[0.06] hover:text-slate-100";
}

function ItemGrid({
  authorsById,
  deleteState,
  emptyLabel = "当前收藏夹没有项目。",
  fallbackAuthor,
  items,
  moveState,
  onDeleteItem,
  onMoveItem,
  onAuthorSelect,
  onRateItem,
  ratingState,
}: {
  authorsById?: Map<string, DashboardAuthorWithNotes>;
  deleteState?: DeleteState;
  emptyLabel?: string;
  fallbackAuthor?: DashboardAuthorWithNotes;
  items: DashboardItemSummary[];
  moveState?: MoveState;
  onDeleteItem?: (item: DashboardItemSummary) => void;
  onMoveItem?: (item: DashboardItemSummary, targetStatus: ItemStatus) => void;
  onAuthorSelect?: (item: DashboardItemSummary) => void;
  onRateItem?: (item: DashboardItemSummary, rating: ItemRating) => void;
  ratingState?: RatingState;
}) {
  if (items.length === 0) {
    return <EmptyList label={emptyLabel} />;
  }

  return (
    <ScrollArea className="h-full">
      <ItemCardGrid
        authorsById={authorsById}
        deleteState={deleteState}
        fallbackAuthor={fallbackAuthor}
        items={items}
        moveState={moveState}
        onDeleteItem={onDeleteItem}
        onMoveItem={onMoveItem}
        onAuthorSelect={onAuthorSelect}
        onRateItem={onRateItem}
        ratingState={ratingState}
      />
    </ScrollArea>
  );
}

function ItemCardGrid({
  authorsById,
  deleteState,
  fallbackAuthor,
  items,
  moveState,
  onDeleteItem,
  onMoveItem,
  onAuthorSelect,
  onRateItem,
  ratingState,
}: {
  authorsById?: Map<string, DashboardAuthorWithNotes>;
  deleteState?: DeleteState;
  fallbackAuthor?: DashboardAuthorWithNotes;
  items: DashboardItemSummary[];
  moveState?: MoveState;
  onDeleteItem?: (item: DashboardItemSummary) => void;
  onMoveItem?: (item: DashboardItemSummary, targetStatus: ItemStatus) => void;
  onAuthorSelect?: (item: DashboardItemSummary) => void;
  onRateItem?: (item: DashboardItemSummary, rating: ItemRating) => void;
  ratingState?: RatingState;
}) {
  const itemWindowKey = `${items.length}:${items[0]?.id ?? ""}:${
    items[items.length - 1]?.id ?? ""
  }`;

  return (
    <ItemCardGridWindow
      authorsById={authorsById}
      deleteState={deleteState}
      fallbackAuthor={fallbackAuthor}
      items={items}
      key={itemWindowKey}
      moveState={moveState}
      onDeleteItem={onDeleteItem}
      onMoveItem={onMoveItem}
      onAuthorSelect={onAuthorSelect}
      onRateItem={onRateItem}
      ratingState={ratingState}
    />
  );
}

function ItemCardGridWindow({
  authorsById,
  deleteState,
  fallbackAuthor,
  items,
  moveState,
  onDeleteItem,
  onMoveItem,
  onAuthorSelect,
  onRateItem,
  ratingState,
}: {
  authorsById?: Map<string, DashboardAuthorWithNotes>;
  deleteState?: DeleteState;
  fallbackAuthor?: DashboardAuthorWithNotes;
  items: DashboardItemSummary[];
  moveState?: MoveState;
  onDeleteItem?: (item: DashboardItemSummary) => void;
  onMoveItem?: (item: DashboardItemSummary, targetStatus: ItemStatus) => void;
  onAuthorSelect?: (item: DashboardItemSummary) => void;
  onRateItem?: (item: DashboardItemSummary, rating: ItemRating) => void;
  ratingState?: RatingState;
}) {
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(initialVisibleItemCount, items.length),
  );

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount],
  );
  const hasMoreItems = visibleItems.length < items.length;
  const loadMoreItems = useCallback(() => {
    setVisibleCount((currentCount) =>
      Math.min(currentCount + visibleItemIncrement, items.length),
    );
  }, [items.length]);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {visibleItems.map((item) => (
          <ItemCard
            author={getItemAuthor(item, authorsById, fallbackAuthor)}
            deleteState={deleteState}
            item={item}
            key={item.id}
            moveState={moveState}
            onDeleteItem={onDeleteItem}
            onMoveItem={onMoveItem}
            onAuthorSelect={onAuthorSelect}
            onRateItem={onRateItem}
            ratingState={ratingState}
          />
        ))}
      </div>
      {hasMoreItems ? (
        <LoadMoreItems
          onLoadMore={loadMoreItems}
          remainingCount={items.length - visibleItems.length}
          visibleCount={visibleItems.length}
        />
      ) : null}
    </>
  );
}

function LoadMoreItems({
  onLoadMore,
  remainingCount,
  visibleCount,
}: {
  onLoadMore: () => void;
  remainingCount: number;
  visibleCount: number;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore();
        }
      },
      { rootMargin: "640px 0px" },
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, [onLoadMore]);

  return (
    <div
      className="flex justify-center px-4 pb-4"
      ref={sentinelRef}
    >
      <button
        className="app-interactive app-focus-ring min-h-10 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-4 text-sm font-semibold text-cyan-100 hover:border-cyan-300/35 hover:bg-cyan-300/15"
        onClick={onLoadMore}
        type="button"
      >
        已显示 {visibleCount} 个，继续加载 {Math.min(remainingCount, visibleItemIncrement)} 个
      </button>
    </div>
  );
}

function getItemAuthor(
  item: DashboardItemSummary,
  authorsById?: Map<string, DashboardAuthorWithNotes>,
  fallbackAuthor?: DashboardAuthorWithNotes,
) {
  const mappedAuthor = authorsById?.get(item.authorId ?? "");
  if (mappedAuthor) {
    return mappedAuthor;
  }

  if (!fallbackAuthor) {
    return undefined;
  }

  return !item.authorId || item.authorId === fallbackAuthor.id
    ? fallbackAuthor
    : undefined;
}

function ItemCard({
  author,
  deleteState,
  item,
  moveState,
  onDeleteItem,
  onMoveItem,
  onAuthorSelect,
  onRateItem,
  ratingState,
}: {
  author?: DashboardAuthorWithNotes;
  deleteState?: DeleteState;
  item: DashboardItemSummary;
  moveState?: MoveState;
  onDeleteItem?: (item: DashboardItemSummary) => void;
  onMoveItem?: (item: DashboardItemSummary, targetStatus: ItemStatus) => void;
  onAuthorSelect?: (item: DashboardItemSummary) => void;
  onRateItem?: (item: DashboardItemSummary, rating: ItemRating) => void;
  ratingState?: RatingState;
}) {
  const authorName = author?.name ?? item.authorName ?? "未知作者";
  const canSelectAuthor = Boolean(item.authorId && onAuthorSelect);
  const isDeleting =
    deleteState?.status === "deleting" && deleteState.itemId === item.id;
  const isMoving = moveState?.status === "moving" && moveState.itemId === item.id;
  const isRating =
    ratingState?.status === "rating" && ratingState.itemId === item.id;
  const ratingInFlight =
    isRating && ratingState?.status === "rating" ? ratingState.rating : null;
  const canUseMoveMenu = Boolean(onMoveItem && !isDeleting && !isMoving);
  const canRate = Boolean(onRateItem && !isDeleting && !isMoving && !isRating);
  const targetStatuses = itemStatuses.filter((status) => status !== item.status);
  const authorIdentity = (
    <>
      <Avatar className="size-7 border border-white/10" size="sm">
        <AvatarImage alt={authorName} src={author?.avatarUrl} />
        <AvatarFallback className="bg-cyan-400/10 text-cyan-100">
          {getInitial(authorName)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 truncate">{authorName}</span>
    </>
  );

  return (
    <Card className="app-card-surface group/item-card aspect-[1/1.618] gap-0 rounded-lg border border-white/10 bg-[#101726] py-0 ring-white/10 hover:border-cyan-300/40 hover:bg-[#121b2d] hover:shadow-xl hover:shadow-cyan-950/25 focus-within:border-cyan-300/45 focus-within:outline focus-within:outline-2 focus-within:outline-cyan-300/45">
      <div className="group/cover relative block min-h-0 flex-[0_0_64%] overflow-hidden rounded-t-lg bg-[#121a2a]">
        <a
          aria-label={`打开 ${item.title}`}
          className="app-focus-ring absolute inset-0"
          href={item.noteUrl}
          rel="noreferrer"
          target="_blank"
        >
          {item.coverUrl ? (
            <img
              alt={item.title}
              className="app-cover-image size-full object-cover group-hover/cover:scale-[1.025] group-hover/cover:brightness-[1.04] group-hover/cover:saturate-[1.04] group-focus-within/cover:scale-[1.025] group-focus-within/cover:brightness-[1.04] group-focus-within/cover:saturate-[1.04]"
              decoding="async"
              loading="lazy"
              src={item.coverUrl}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-slate-600">
              <ImageIcon className="size-9" />
            </div>
          )}
          <span className="app-interactive absolute bottom-2 right-2 inline-flex size-8 translate-y-1 items-center justify-center rounded-md border border-white/15 bg-black/45 text-white opacity-0 backdrop-blur group-hover/cover:translate-y-0 group-hover/cover:opacity-100 group-focus-visible/cover:translate-y-0 group-focus-visible/cover:opacity-100">
            <ExternalLink className="size-4" />
          </span>
        </a>
        <span className="absolute left-2 top-2 inline-flex size-8 items-center justify-center rounded-md border border-white/15 bg-black/55 text-white backdrop-blur">
          <MediaTypeIcon className="size-4" mediaType={item.mediaType} />
        </span>
        {onMoveItem ? (
          <div className="group/move-menu absolute right-12 top-2 z-30">
            <button
              aria-haspopup="menu"
              aria-label={`移动 ${item.title}`}
              className="app-interactive app-focus-ring inline-flex size-8 items-center justify-center rounded-md border border-cyan-200/25 bg-cyan-500/20 text-cyan-50 opacity-80 backdrop-blur hover:border-cyan-200/45 hover:bg-cyan-500/35 hover:opacity-100 disabled:translate-y-0 disabled:cursor-wait"
              disabled={!canUseMoveMenu}
              title="移动"
              type="button"
            >
              {isMoving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FolderInput className="size-4" />
              )}
            </button>
            <div
              className={cn(
                "app-interactive pointer-events-none absolute right-0 top-8 grid w-32 translate-y-1 gap-1 rounded-lg border border-white/15 bg-[#08111f]/95 p-1.5 text-sm opacity-0 shadow-xl shadow-black/30 backdrop-blur",
                canUseMoveMenu &&
                  "group-hover/move-menu:pointer-events-auto group-hover/move-menu:translate-y-0 group-hover/move-menu:opacity-100 group-focus-within/move-menu:pointer-events-auto group-focus-within/move-menu:translate-y-0 group-focus-within/move-menu:opacity-100",
              )}
              role="menu"
            >
              {targetStatuses.map((status) => (
                <button
                  className="app-interactive app-focus-ring flex min-h-8 items-center rounded-md px-2 text-left text-xs font-semibold text-slate-200 hover:bg-cyan-300/10 hover:text-cyan-50 disabled:cursor-wait disabled:opacity-60"
                  key={status}
                  onClick={() => onMoveItem(item, status)}
                  role="menuitem"
                  type="button"
                >
                  {itemStatusLabels[status]}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {onDeleteItem ? (
          <button
            aria-label={`删除 ${item.title}`}
            className="app-interactive app-focus-ring absolute right-2 top-2 z-10 inline-flex size-8 items-center justify-center rounded-md border border-rose-200/25 bg-rose-500/20 text-rose-50 opacity-80 backdrop-blur hover:border-rose-200/45 hover:bg-rose-500/35 hover:opacity-100 disabled:translate-y-0 disabled:cursor-wait"
            disabled={isDeleting || isMoving}
            onClick={() => onDeleteItem(item)}
            title="删除"
            type="button"
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </button>
        ) : null}
      </div>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-50">
          {item.title}
        </h3>
        {onRateItem ? (
          <div
            aria-label={`${item.title} 评级`}
            className="inline-flex w-fit rounded-md border border-white/10 bg-black/20 p-0.5"
            role="group"
          >
            {itemRatings.map((rating) => {
              const active = item.rating === rating;
              const loadingThisRating = ratingInFlight === rating;

              return (
                <button
                  aria-pressed={active}
                  className={cn(
                    "app-interactive app-focus-ring inline-flex h-6 min-w-7 items-center justify-center rounded-[5px] border px-1.5 text-[11px] font-black leading-none shadow-sm hover:border-white/20 hover:bg-white/10 hover:text-white disabled:translate-y-0",
                    active
                      ? ratingTone[rating]
                      : "border-transparent bg-transparent text-slate-500",
                    loadingThisRating && "cursor-wait text-white",
                  )}
                  disabled={!canRate || active}
                  key={rating}
                  onClick={() => onRateItem(item, rating)}
                  title={`评级 ${itemRatingLabels[rating]}`}
                  type="button"
                >
                  {loadingThisRating ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    itemRatingLabels[rating]
                  )}
                </button>
              );
            })}
          </div>
        ) : null}
        {canSelectAuthor ? (
          <button
            className="app-interactive app-focus-ring -mx-1.5 flex min-h-8 w-full min-w-0 items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm text-slate-300 hover:bg-cyan-300/[0.08] hover:text-cyan-100 active:translate-y-px"
            onClick={() => onAuthorSelect?.(item)}
            type="button"
          >
            {authorIdentity}
            <ArrowUpRight className="size-3.5 shrink-0" />
          </button>
        ) : (
          <div className="flex min-w-0 items-center gap-2 text-sm text-slate-300">
            {authorIdentity}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DeleteConfirmDialog({
  deleteState,
  item,
  onCancel,
  onConfirm,
}: {
  deleteState: DeleteState;
  item: DashboardItemSummary | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const itemId = item?.id;
  const isDeleting =
    Boolean(itemId) &&
    deleteState.status === "deleting" &&
    deleteState.itemId === itemId;
  const errorMessage =
    deleteState.status === "error" ? deleteState.message : null;

  useEffect(() => {
    if (item) {
      cancelButtonRef.current?.focus();
    }
  }, [item]);

  if (!item) {
    return null;
  }

  function handleCancel() {
    if (!isDeleting) {
      onCancel();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleCancel();
        }
      }}
      role="presentation"
    >
      <section
        aria-describedby="delete-dialog-description"
        aria-labelledby="delete-dialog-title"
        aria-modal="true"
        className="w-full max-w-md rounded-lg border border-rose-200/20 bg-[#0b101b] p-4 text-slate-100 shadow-2xl shadow-black/50 outline-none"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            handleCancel();
          }
        }}
        role="alertdialog"
      >
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-rose-200/20 bg-rose-500/15 text-rose-100">
            <Trash2 className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              className="truncate text-base font-semibold text-white"
              id="delete-dialog-title"
            >
              删除这条笔记？
            </h2>
            <p
              className="mt-1 text-sm leading-6 text-slate-400"
              id="delete-dialog-description"
            >
              删除后会从当前收藏夹和作者详情中移除，之后需要重新导入才能恢复。
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-2">
          <div className="overflow-hidden rounded-md bg-[#121a2a]">
            {item.coverUrl ? (
              <img
                alt={item.title}
                className="aspect-square size-16 object-cover"
                decoding="async"
                src={item.coverUrl}
              />
            ) : (
              <div className="flex aspect-square size-16 items-center justify-center text-slate-600">
                <ImageIcon className="size-6" />
              </div>
            )}
          </div>
          <div className="min-w-0 py-1">
            <p className="line-clamp-2 text-sm font-semibold text-slate-100">
              {item.title}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500">
              {item.authorName ?? "未知作者"}
            </p>
          </div>
        </div>

        {errorMessage ? (
          <p className="mt-3 flex items-center gap-1.5 rounded-md border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
            <AlertCircle className="size-4 shrink-0" />
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          <button
            className={cn(
              buttonVariants({ variant: "outline" }),
              "app-interactive app-focus-ring border-white/10 bg-white/[0.03] text-slate-100 hover:border-white/20 hover:bg-white/[0.07]",
            )}
            disabled={isDeleting}
            onClick={handleCancel}
            ref={cancelButtonRef}
            type="button"
          >
            取消
          </button>
          <button
            className={cn(
              buttonVariants(),
              "app-interactive app-focus-ring border-rose-200/20 bg-rose-500/85 text-white hover:bg-rose-400 disabled:translate-y-0",
            )}
            disabled={isDeleting}
            onClick={onConfirm}
            type="button"
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            删除
          </button>
        </div>
      </section>
    </div>
  );
}

function AuthorExplorer({
  authors,
  deleteState,
  detail,
  moveState,
  onDeleteItem,
  onMoveItem,
  onRateItem,
  onSelectAuthor,
  ratingState,
  selectedAuthorId,
}: {
  authors: DashboardAuthorWithNotes[];
  deleteState?: DeleteState;
  detail: DashboardAuthorDetail | null;
  moveState?: MoveState;
  onDeleteItem?: (item: DashboardItemSummary) => void;
  onMoveItem?: (item: DashboardItemSummary, targetStatus: ItemStatus) => void;
  onRateItem?: (item: DashboardItemSummary, rating: ItemRating) => void;
  onSelectAuthor: (authorId: string) => void;
  ratingState?: RatingState;
  selectedAuthorId: string | null;
}) {
  if (authors.length === 0) {
    return <EmptyList label="当前来源没有作者。" />;
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-[280px_minmax(0,1fr)] lg:grid-cols-[320px_minmax(0,1fr)] lg:grid-rows-1">
      <aside className="min-h-0 overflow-hidden border-b border-white/10 bg-[#0a0f1a] lg:border-b-0 lg:border-r">
        <ScrollArea className="h-full">
          <div className="grid gap-2 p-4">
            {authors.map((author) => (
              <AuthorRow
                active={author.id === selectedAuthorId}
                author={author}
                key={author.id}
                onSelectAuthor={onSelectAuthor}
              />
            ))}
          </div>
        </ScrollArea>
      </aside>
      <AuthorDetailPanel
        deleteState={deleteState}
        detail={detail}
        moveState={moveState}
        onDeleteItem={onDeleteItem}
        onMoveItem={onMoveItem}
        onRateItem={onRateItem}
        ratingState={ratingState}
      />
    </div>
  );
}

function AuthorRow({
  active,
  author,
  onSelectAuthor,
}: {
  active: boolean;
  author: DashboardAuthorWithNotes;
  onSelectAuthor: (authorId: string) => void;
}) {
  return (
    <button
      aria-current={active ? "page" : undefined}
      className={cn(
        "app-interactive app-focus-ring flex min-h-14 items-center gap-3 rounded-lg border px-3 py-2 text-left outline-none active:translate-y-px",
        active
          ? "border-fuchsia-300/45 bg-fuchsia-400/15 text-white shadow-lg shadow-fuchsia-950/25 hover:border-fuchsia-300/60 hover:bg-fuchsia-400/[0.18]"
          : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-fuchsia-300/35 hover:bg-white/[0.07] hover:text-white",
      )}
      onClick={() => onSelectAuthor(author.id)}
      type="button"
    >
      <Avatar className="size-9 border border-white/10">
        <AvatarImage alt={author.name} src={author.avatarUrl} />
        <AvatarFallback className="bg-fuchsia-400/10 text-fuchsia-100">
          {getInitial(author.name)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{author.name}</span>
        <span className="mt-1 block text-xs text-slate-500">
          {author.noteCount} 条笔记
        </span>
      </span>
    </button>
  );
}

function AuthorDetailPanel({
  deleteState,
  detail,
  moveState,
  onDeleteItem,
  onMoveItem,
  onRateItem,
  ratingState,
}: {
  deleteState?: DeleteState;
  detail: DashboardAuthorDetail | null;
  moveState?: MoveState;
  onDeleteItem?: (item: DashboardItemSummary) => void;
  onMoveItem?: (item: DashboardItemSummary, targetStatus: ItemStatus) => void;
  onRateItem?: (item: DashboardItemSummary, rating: ItemRating) => void;
  ratingState?: RatingState;
}) {
  if (!detail) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-slate-400">
          选择一个作者查看详情。
        </div>
      </div>
    );
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-white/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-12 border border-white/10" size="lg">
              <AvatarImage alt={detail.author.name} src={detail.author.avatarUrl} />
              <AvatarFallback className="bg-fuchsia-400/10 text-fuchsia-100">
                {getInitial(detail.author.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold text-white">
                {detail.author.name}
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                已导入 {detail.author.noteCount} 条笔记
              </p>
            </div>
          </div>
          {detail.author.profileUrl ? (
            <a
              className={cn(
                buttonVariants({ size: "icon", variant: "outline" }),
                "app-interactive app-focus-ring border-white/10 bg-white/[0.03] text-slate-100 hover:border-fuchsia-300/40 hover:bg-fuchsia-400/10 hover:shadow-lg hover:shadow-fuchsia-950/25 active:translate-y-px",
              )}
              href={detail.author.profileUrl}
              rel="noreferrer"
              target="_blank"
              title="打开作者主页"
            >
              <ExternalLink className="size-4" />
              <span className="sr-only">打开作者主页</span>
            </a>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <GroupedAuthorItemGrid
          author={detail.author}
          deleteState={deleteState}
          items={detail.items}
          moveState={moveState}
          onDeleteItem={onDeleteItem}
          onMoveItem={onMoveItem}
          onRateItem={onRateItem}
          ratingState={ratingState}
        />
      </div>
    </section>
  );
}

function GroupedAuthorItemGrid({
  author,
  deleteState,
  items,
  moveState,
  onDeleteItem,
  onMoveItem,
  onRateItem,
  ratingState,
}: {
  author: DashboardAuthorWithNotes;
  deleteState?: DeleteState;
  items: DashboardItemSummary[];
  moveState?: MoveState;
  onDeleteItem?: (item: DashboardItemSummary) => void;
  onMoveItem?: (item: DashboardItemSummary, targetStatus: ItemStatus) => void;
  onRateItem?: (item: DashboardItemSummary, rating: ItemRating) => void;
  ratingState?: RatingState;
}) {
  if (items.length === 0) {
    return <EmptyList label="当前作者没有已导入笔记。" />;
  }

  return (
    <ScrollArea className="h-full">
      <div className="grid gap-5 p-4">
        {itemStatuses.map((status) => {
          const groupItems = items.filter((item) => item.status === status);

          return (
            <section
              aria-labelledby={`author-notes-${status}`}
              className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.025]"
              key={status}
            >
              <div className="flex min-h-12 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <CollectionIcon
                    className={cn(
                      "size-4 shrink-0",
                      getStatusIconTone(status),
                    )}
                    status={status}
                  />
                  <h4
                    className="truncate text-sm font-semibold text-slate-100"
                    id={`author-notes-${status}`}
                  >
                    {itemStatusLabels[status]}
                  </h4>
                </div>
                <Badge
                  className="h-6 border-white/10 bg-black/20 px-2 text-slate-300"
                  variant="outline"
                >
                  {groupItems.length}
                </Badge>
              </div>

              {groupItems.length > 0 ? (
                <ItemCardGrid
                  deleteState={deleteState}
                  fallbackAuthor={author}
                  items={groupItems}
                  moveState={moveState}
                  onDeleteItem={onDeleteItem}
                  onMoveItem={onMoveItem}
                  onRateItem={onRateItem}
                  ratingState={ratingState}
                />
              ) : (
                <div className="px-4 py-5 text-sm text-slate-500">
                  暂无{itemStatusLabels[status]}笔记
                </div>
              )}
            </section>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function LoadingState() {
  return (
    <section className="grid min-h-0 flex-1 overflow-hidden rounded-lg border border-white/10 bg-[#0b101b] lg:grid-cols-[296px_minmax(0,1fr)]">
      <div className="border-b border-white/10 bg-[#080c15] p-4 lg:border-b-0 lg:border-r">
        <Skeleton className="mb-4 h-12 bg-white/10" />
        {[0, 1, 2, 3].map((item) => (
          <Skeleton className="mb-2 h-11 bg-white/10" key={item} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[0, 1, 2, 3, 4].map((item) => (
          <Skeleton className="aspect-[1/1.618] rounded-lg bg-white/10" key={item} />
        ))}
      </div>
    </section>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <section className="flex min-h-0 flex-1 items-start justify-center rounded-lg border border-rose-300/25 bg-rose-400/10 p-6 text-rose-100">
      <div className="flex max-w-xl gap-3 rounded-lg border border-rose-300/25 bg-black/20 p-4">
        <AlertCircle className="mt-0.5 size-5 shrink-0" />
        <div>
          <h2 className="font-semibold">API 连接失败</h2>
          <p className="mt-2 text-sm text-rose-100/80">{message}</p>
        </div>
      </div>
    </section>
  );
}

function EmptyList({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-slate-400">
        {label}
      </div>
    </div>
  );
}

function NavigationEntryIcon({
  className,
  entry,
}: {
  className?: string;
  entry: DashboardNavigationEntry;
}) {
  if (entry.type === "authors") {
    return <Users className={className} />;
  }
  return <CollectionIcon className={className} status={entry.status} />;
}

function CollectionIcon({
  className,
  status,
}: {
  className?: string;
  status: ItemStatus;
}) {
  if (status === "downloaded") {
    return <CheckCircle2 className={className} />;
  }
  if (status === "not_downloaded") {
    return <CircleSlash2 className={className} />;
  }
  return <Download className={className} />;
}

function getStatusIconTone(status: ItemStatus) {
  if (status === "downloaded") {
    return "text-emerald-200";
  }
  if (status === "not_downloaded") {
    return "text-rose-200";
  }
  return "text-cyan-200";
}

function MediaTypeIcon({
  className,
  mediaType,
}: {
  className?: string;
  mediaType: DashboardItemSummary["mediaType"];
}) {
  if (mediaType === "video") {
    return <Film className={className} />;
  }
  return <FileImage className={className} />;
}

function getInitial(value?: string) {
  return value?.trim().slice(0, 1).toUpperCase() || "?";
}

function isSelected(
  selection: DashboardNavigationSelection,
  entry: DashboardNavigationEntry,
): boolean {
  if (selection.type !== entry.type || selection.source !== entry.source) {
    return false;
  }
  if (selection.type === "authors") {
    return true;
  }
  return (
    entry.type === "collection" &&
    selection.status === entry.status &&
    selection.ratingFilter === "unrated"
  );
}

function isCollectionSelected(
  selection: DashboardNavigationSelection,
  entry: CollectionNavigationEntry,
): boolean {
  return (
    selection.type === "collection" &&
    selection.source === entry.source &&
    selection.status === entry.status
  );
}

function isRatingFilterSelected(
  selection: DashboardNavigationSelection,
  entry: CollectionNavigationEntry,
  ratingFilter: RatingFilter,
): boolean {
  return (
    isCollectionSelected(selection, entry) &&
    selection.type === "collection" &&
    selection.ratingFilter === ratingFilter
  );
}

async function fetchDashboard(
  apiBaseUrl: string,
  signal?: AbortSignal,
): Promise<DashboardResponse> {
  const response = await fetch(`${apiBaseUrl}/api/dashboard`, {
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
  return normalizeDashboard((await response.json()) as DashboardResponse);
}

function normalizeDashboard(dashboard: DashboardResponse): DashboardResponse {
  return {
    ...dashboard,
    authors: dashboard.authors ?? [],
    items: dashboard.items ?? dashboard.recentItems ?? [],
    recentItems: dashboard.recentItems ?? [],
  };
}
