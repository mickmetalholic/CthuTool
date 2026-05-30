import type { CollectionExtractionDraft } from "./dom-adapter"

const DEFAULT_ITEM_SELECTOR = ".note-item"
const DEFAULT_DELAY_MS = 100
const DEFAULT_BILIBILI_PAGE_DELAY_MS = 2500
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

type ClickableElement = {
  click?(): void
  disabled?: boolean
  getAttribute?(name: string): string | null
  textContent?: string | null
}

type ScrollableDocument = {
  body?: ScrollableElement
  documentElement?: ScrollableElement
  querySelector?(selector: string): ClickableElement | null
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

export type PageCollectionLoaderOptions = CollectionScrollExtractorOptions & {
  bilibiliMaxPages?: number
  bilibiliPageDelayMs?: number
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

export async function extractCollectionFromPage(
  options: PageCollectionLoaderOptions
): Promise<CollectionExtractionDraft> {
  const rootDocument = options.document ?? document
  if (isBilibiliFavlistDocument(rootDocument)) {
    return extractBilibiliFavlistPages({
      ...options,
      document: rootDocument,
      maxPages: options.bilibiliMaxPages
    })
  }

  const firstDraft = await extractCollectionWhileScrolling(options)
  if (firstDraft.source !== "bilibili") {
    return firstDraft
  }

  return extractBilibiliFavlistPages({
    ...options,
    initialDraft: firstDraft,
    maxPages: options.bilibiliMaxPages
  })
}

export async function extractBilibiliFavlistPages(
  options: PageCollectionLoaderOptions & {
    initialDraft?: CollectionExtractionDraft
    maxPages?: number
  }
): Promise<CollectionExtractionDraft> {
  const rootDocument = options.document ?? document
  const wait = options.wait ?? delay
  const delayMs = options.delayMs ?? DEFAULT_DELAY_MS
  const pageDelayMs = Math.max(
    0,
    options.bilibiliPageDelayMs ?? DEFAULT_BILIBILI_PAGE_DELAY_MS
  )
  const maxPages = Math.max(
    1,
    options.maxPages ?? options.bilibiliMaxPages ?? Number.POSITIVE_INFINITY
  )
  const collectedItems = new Map<
    string,
    CollectionExtractionDraft["items"][number]
  >()
  let collectedDraft: CollectionExtractionDraft | undefined

  await collectDraft(options.initialDraft)
  options.onProgress?.({ itemCount: collectedItems.size, scrolls: 0 })

  for (let page = 1; page < maxPages; page += 1) {
    const beforeSignature = readBilibiliCardSignature(rootDocument)
    const nextButton = findBilibiliNextPageButton(rootDocument)
    if (!nextButton) {
      break
    }

    if (pageDelayMs > 0) {
      await wait(pageDelayMs)
    }
    nextButton.click?.()
    const changed = await waitForBilibiliCardsToChange({
      beforeSignature,
      delayMs,
      document: rootDocument,
      wait
    })
    if (!changed) {
      break
    }

    await collectDraft()
    options.onProgress?.({ itemCount: collectedItems.size, scrolls: page })
  }

  return requireCollectedDraft()

  async function collectDraft(initialDraft?: CollectionExtractionDraft) {
    const draft = initialDraft ?? (await extractBilibiliCurrentPageDraft())
    collectedDraft = collectedDraft
      ? {
          ...collectedDraft,
          collection: {
            ...collectedDraft.collection,
            coverUrl: collectedDraft.collection.coverUrl ?? draft.collection.coverUrl
          }
        }
      : draft

    for (const item of draft.items) {
      collectedItems.set(item.id ?? item.noteUrl, item)
    }
  }

  async function extractBilibiliCurrentPageDraft() {
    let lastError: unknown
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        return options.extract()
      } catch (error) {
        lastError = error
        if (readBilibiliCardSignature(rootDocument)) {
          break
        }
        await wait(delayMs)
      }
    }

    throw lastError instanceof Error ? lastError : new Error("当前页面抽取失败")
  }

  function requireCollectedDraft(): CollectionExtractionDraft {
    if (!collectedDraft) {
      throw new Error("当前页面抽取失败")
    }

    return {
      ...collectedDraft,
      items: Array.from(collectedItems.values())
    }
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

function isBilibiliFavlistDocument(document: ScrollableDocument): boolean {
  const href = readDocumentHref(document)
  if (!href) {
    return false
  }

  try {
    const url = new URL(href, "https://space.bilibili.com")
    if (url.hostname !== "space.bilibili.com") {
      return false
    }
    const hasMid = /^\/\d+(?:\/favlist)?\/?$/.test(url.pathname)
    return (
      hasMid &&
      (url.pathname.includes("/favlist") ||
        url.searchParams.has("fid") ||
        Boolean(readBilibiliCardSignature(document)))
    )
  } catch {
    return false
  }
}

function readDocumentHref(document: ScrollableDocument): string | undefined {
  return (document as ScrollableDocument & { location?: { href?: string } })
    .location?.href
}

function findBilibiliNextPageButton(
  document: ScrollableDocument
): ClickableElement | undefined {
  const candidates = [
    ...queryUnknownAll(document, "button.vui_pagenation--btn-side").filter(
      (element) => cleanText(element.textContent) === "下一页"
    ),
    ...queryUnknownAll(document, "li.be-pager-next"),
    ...queryUnknownAll(document, ".be-pager-next")
  ]

  return candidates.find((element) => !isDisabledControl(element))
}

async function waitForBilibiliCardsToChange({
  beforeSignature,
  delayMs,
  document,
  wait
}: {
  beforeSignature: string
  delayMs: number
  document: ScrollableDocument
  wait: (delayMs: number) => Promise<void>
}): Promise<boolean> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await wait(delayMs)
    const nextSignature = readBilibiliCardSignature(document)
    if (nextSignature && nextSignature !== beforeSignature) {
      return true
    }
  }
  return false
}

function readBilibiliCardSignature(document: ScrollableDocument): string {
  const bvids = queryUnknownAll(document, 'a[href*="/video/BV"]')
    .map((link) => link.getAttribute?.("href")?.match(/BV[0-9A-Za-z]+/)?.[0])
    .filter((bvid): bvid is string => Boolean(bvid))
  if (bvids.length > 0) {
    return bvids.join("|")
  }

  return queryUnknownAll(document, ".items__item")
    .map((card) => cleanText(card.textContent) ?? "")
    .filter(Boolean)
    .join("|")
}

function queryUnknownAll(
  document: ScrollableDocument,
  selector: string
): ClickableElement[] {
  return Array.from(document.querySelectorAll(selector)).filter(
    (element): element is ClickableElement => Boolean(element)
  )
}

function isDisabledControl(element: ClickableElement): boolean {
  const className = element.getAttribute?.("class") ?? ""
  const disabledAttribute = element.getAttribute?.("disabled")
  return (
    Boolean(element.disabled) ||
    element.getAttribute?.("aria-disabled") === "true" ||
    (disabledAttribute !== undefined && disabledAttribute !== null) ||
    className.includes("vui_button--disabled") ||
    className.includes("be-pager-disabled")
  )
}

function cleanText(value: string | null | undefined): string | undefined {
  const text = value?.replace(/\s+/g, " ").trim()
  return text ? text : undefined
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
