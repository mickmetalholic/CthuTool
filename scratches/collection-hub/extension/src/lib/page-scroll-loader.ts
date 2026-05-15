import type { CollectionExtractionDraft } from "./dom-adapter"

const DEFAULT_ITEM_SELECTOR = ".note-item"
const DEFAULT_DELAY_MS = 100
const DEFAULT_COLLECTION_MAX_SCROLLS = Number.POSITIVE_INFINITY
const DEFAULT_MAX_SCROLLS = 360
const DEFAULT_MAX_NO_GROWTH_ROUNDS = 16
const DEFAULT_SCROLL_STEP_RATIO = 0.25
const DEFAULT_STABLE_ROUNDS = 3

type ScrollableElement = {
  clientHeight?: number
  scrollHeight?: number
  scrollTo?(options: ScrollToOptions): void
  scrollTop?: number
}

type ScrollableDocument = {
  body?: ScrollableElement
  documentElement?: ScrollableElement
  querySelectorAll(selector: string): ArrayLike<unknown> | Iterable<unknown>
  scrollingElement?: ScrollableElement | null
}

type ScrollableWindow = {
  innerHeight?: number
  scrollY?: number
  scrollTo(options: ScrollToOptions): void
}

type PageScrollSnapshot = {
  itemCount: number
  scrollHeight: number
}

export type PageScrollLoaderOptions = {
  delayMs?: number
  document?: ScrollableDocument
  itemSelector?: string
  maxNoGrowthRounds?: number
  maxScrolls?: number
  onProgress?: (progress: CollectionScrollProgress) => void
  scrollStepRatio?: number
  stableRounds?: number
  wait?: (delayMs: number) => Promise<void>
  window?: ScrollableWindow
}

export type PageScrollLoaderResult = PageScrollSnapshot & {
  completed: boolean
  scrolls: number
}

export type CollectionScrollExtractorOptions = Omit<
  PageScrollLoaderOptions,
  "itemSelector"
> & {
  extract: () => CollectionExtractionDraft
}

export type CollectionScrollProgress = {
  itemCount: number
  scrolls: number
}

export async function scrollUntilLazyItemsLoaded(
  options: PageScrollLoaderOptions = {}
): Promise<PageScrollLoaderResult> {
  const rootDocument = options.document ?? document
  const currentWindow = options.window ?? window
  const wait = options.wait ?? delay
  const delayMs = options.delayMs ?? DEFAULT_DELAY_MS
  const itemSelector = options.itemSelector ?? DEFAULT_ITEM_SELECTOR
  const maxScrolls = options.maxScrolls ?? DEFAULT_MAX_SCROLLS
  const stableRounds = Math.max(
    1,
    options.stableRounds ?? DEFAULT_STABLE_ROUNDS
  )

  let previous = readSnapshot(rootDocument, itemSelector)
  let stableRoundCount = 0

  for (let scrolls = 1; scrolls <= maxScrolls; scrolls += 1) {
    currentWindow.scrollTo({ behavior: "instant", top: previous.scrollHeight })
    await wait(delayMs)

    const next = readSnapshot(rootDocument, itemSelector)
    stableRoundCount = snapshotsMatch(previous, next) ? stableRoundCount + 1 : 0
    previous = next

    if (stableRoundCount >= stableRounds) {
      return {
        ...next,
        completed: true,
        scrolls
      }
    }
  }

  return {
    ...previous,
    completed: false,
    scrolls: maxScrolls
  }
}

export async function extractCollectionWhileScrolling(
  options: CollectionScrollExtractorOptions
): Promise<CollectionExtractionDraft> {
  const rootDocument = options.document ?? document
  const currentWindow = options.window ?? window
  const wait = options.wait ?? delay
  const delayMs = options.delayMs ?? DEFAULT_DELAY_MS
  const maxNoGrowthRounds =
    options.maxNoGrowthRounds ?? DEFAULT_MAX_NO_GROWTH_ROUNDS
  const maxScrolls = options.maxScrolls ?? DEFAULT_COLLECTION_MAX_SCROLLS
  const scrollStepRatio = options.scrollStepRatio ?? DEFAULT_SCROLL_STEP_RATIO
  const stableRounds = Math.max(
    1,
    options.stableRounds ?? DEFAULT_STABLE_ROUNDS
  )
  const collectedItems = new Map<
    string,
    CollectionExtractionDraft["items"][number]
  >()
  let collectedDraft: CollectionExtractionDraft | undefined
  let lastError: unknown
  let previousItemCount = -1
  let noGrowthRounds = 0
  let stableRoundCount = 0

  if (resetScrollPositions(rootDocument, currentWindow)) {
    await wait(delayMs)
  }
  collectCurrentDraft()
  emitProgress(0)

  for (let scrolls = 1; scrolls <= maxScrolls; scrolls += 1) {
    const moved = scrollForward(rootDocument, currentWindow, scrollStepRatio)
    await wait(delayMs)
    collectCurrentDraft()
    emitProgress(scrolls)

    const itemCountUnchanged = collectedItems.size === previousItemCount
    if (!moved && itemCountUnchanged) {
      noGrowthRounds += 1
      stableRoundCount += 1
    } else {
      noGrowthRounds = 0
      stableRoundCount = 0
    }
    previousItemCount = collectedItems.size

    if (
      stableRoundCount >= stableRounds ||
      noGrowthRounds >= maxNoGrowthRounds
    ) {
      return requireCollectedDraft()
    }
  }

  return requireCollectedDraft()

  function collectCurrentDraft() {
    try {
      const draft = options.extract()
      collectedDraft = collectedDraft
        ? {
            ...collectedDraft,
            collection: {
              ...collectedDraft.collection,
              coverUrl:
                collectedDraft.collection.coverUrl ?? draft.collection.coverUrl
            }
          }
        : draft

      for (const item of draft.items) {
        collectedItems.set(item.id ?? item.noteUrl, item)
      }
      lastError = undefined
    } catch (error) {
      lastError = error
    }
  }

  function requireCollectedDraft(): CollectionExtractionDraft {
    if (!collectedDraft) {
      throw lastError instanceof Error
        ? lastError
        : new Error("当前页面抽取失败")
    }

    return {
      ...collectedDraft,
      items: Array.from(collectedItems.values())
    }
  }

  function emitProgress(scrolls: number) {
    options.onProgress?.({
      itemCount: collectedItems.size,
      scrolls
    })
  }
}

function readSnapshot(
  document: ScrollableDocument,
  itemSelector: string
): PageScrollSnapshot {
  return {
    itemCount: Array.from(document.querySelectorAll(itemSelector)).length,
    scrollHeight: Math.max(
      document.documentElement?.scrollHeight ?? 0,
      document.body?.scrollHeight ?? 0
    )
  }
}

function snapshotsMatch(
  previous: PageScrollSnapshot,
  next: PageScrollSnapshot
): boolean {
  return (
    previous.itemCount === next.itemCount &&
    previous.scrollHeight === next.scrollHeight
  )
}

type ScrollCandidate = {
  maxTop: number
  readTop(): number
  viewportHeight: number
  scrollTo(top: number): void
}

function scrollForward(
  document: ScrollableDocument,
  currentWindow: ScrollableWindow,
  stepRatio: number
): boolean {
  return findScrollCandidates(document, currentWindow)
    .map((candidate) => scrollCandidateForward(candidate, stepRatio))
    .some(Boolean)
}

function resetScrollPositions(
  document: ScrollableDocument,
  currentWindow: ScrollableWindow
): boolean {
  return findScrollCandidates(document, currentWindow)
    .map((candidate) => {
      const currentTop = candidate.readTop()
      if (currentTop <= 0) {
        return false
      }
      candidate.scrollTo(0)
      return candidate.readTop() < currentTop - 1
    })
    .some(Boolean)
}

function findScrollCandidates(
  document: ScrollableDocument,
  currentWindow: ScrollableWindow
): ScrollCandidate[] {
  const elements = new Set<ScrollableElement>()
  if (document.scrollingElement) {
    elements.add(document.scrollingElement)
  }
  if (document.documentElement) {
    elements.add(document.documentElement)
  }
  if (document.body) {
    elements.add(document.body)
  }

  for (const element of Array.from(document.querySelectorAll("*"))) {
    if (isScrollableElement(element)) {
      elements.add(element)
    }
  }

  return [
    createWindowScrollCandidate(document, currentWindow),
    ...Array.from(elements).map(createElementScrollCandidate)
  ]
    .filter((candidate): candidate is ScrollCandidate => Boolean(candidate))
    .sort((left, right) => right.maxTop - left.maxTop)
}

function createWindowScrollCandidate(
  document: ScrollableDocument,
  currentWindow: ScrollableWindow
): ScrollCandidate | undefined {
  const viewportHeight =
    currentWindow.innerHeight ??
    document.documentElement?.clientHeight ??
    document.body?.clientHeight ??
    0
  const scrollHeight = Math.max(
    document.documentElement?.scrollHeight ?? 0,
    document.body?.scrollHeight ?? 0
  )
  const maxTop = Math.max(0, scrollHeight - viewportHeight)
  if (maxTop <= 0 || viewportHeight <= 0) {
    return undefined
  }

  return {
    maxTop,
    readTop() {
      return (
        currentWindow.scrollY ??
        document.documentElement?.scrollTop ??
        document.body?.scrollTop ??
        0
      )
    },
    scrollTo(top) {
      currentWindow.scrollTo({ behavior: "instant", top })
    },
    viewportHeight
  }
}

function createElementScrollCandidate(
  element: ScrollableElement
): ScrollCandidate | undefined {
  const viewportHeight = element.clientHeight ?? 0
  const maxTop = Math.max(0, (element.scrollHeight ?? 0) - viewportHeight)
  if (maxTop <= 0 || viewportHeight <= 0) {
    return undefined
  }

  return {
    maxTop,
    readTop() {
      return element.scrollTop ?? 0
    },
    scrollTo(top) {
      if (element.scrollTo) {
        element.scrollTo({ behavior: "instant", top })
      } else {
        element.scrollTop = top
      }
    },
    viewportHeight
  }
}

function scrollCandidateForward(
  candidate: ScrollCandidate,
  stepRatio: number
): boolean {
  const currentTop = candidate.readTop()
  const nextTop = Math.min(
    candidate.maxTop,
    currentTop + Math.max(1, Math.floor(candidate.viewportHeight * stepRatio))
  )
  if (nextTop <= currentTop + 1) {
    return false
  }

  candidate.scrollTo(nextTop)
  return candidate.readTop() > currentTop + 1
}

function isScrollableElement(value: unknown): value is ScrollableElement {
  const element = value as ScrollableElement | undefined
  return (
    typeof element?.scrollHeight === "number" &&
    typeof element.clientHeight === "number" &&
    element.scrollHeight > element.clientHeight
  )
}

function delay(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs)
  })
}
