import type {
  CollectionExtractionDraft,
  DomCollectionAdapter,
  QueryableDocument,
  QueryableElement
} from "./dom-adapter"

const XHS_SOURCE = "xhs"
const XHS_ORIGIN = "https://www.xiaohongshu.com"
const BOARD_PATH_PATTERN = /^\/board\/([^/?#]+)/
export const XHS_CARD_SELECTOR = ".note-item"

export const xhsBoardDomAdapter: DomCollectionAdapter = {
  id: "xhs-board-dom-adapter",

  canHandle(document) {
    return Boolean(readBoardId(document.location?.href))
  },

  extract(document) {
    const boardId = requireValue(
      readBoardId(document.location?.href),
      "当前页面不是小红书收藏夹"
    )
    const sourceUrl =
      document.location?.href ?? `${XHS_ORIGIN}/board/${boardId}`
    const cards = queryAll(document, XHS_CARD_SELECTOR)
    const items = cards
      .map((card) => extractCard(card, boardId))
      .filter((item): item is NonNullable<ReturnType<typeof extractCard>> =>
        Boolean(item)
      )

    if (items.length === 0) {
      throw new Error("当前小红书收藏夹没有可导入的笔记卡片")
    }

    return {
      source: XHS_SOURCE,
      collection: {
        id: `xhs:board:${boardId}`,
        sourceUrl,
        title: readCollectionTitle(document) ?? "小红书收藏夹",
        coverUrl: items[0]?.coverUrl
      },
      items
    }
  }
}

export function extractXhsBoardCardDraft(
  document: QueryableDocument,
  card: QueryableElement
): CollectionExtractionDraft | undefined {
  const boardId = readBoardId(document.location?.href)
  if (!boardId) {
    return undefined
  }

  const item = extractCard(card, boardId)
  if (!item) {
    return undefined
  }

  const sourceUrl = document.location?.href ?? `${XHS_ORIGIN}/board/${boardId}`
  return {
    source: XHS_SOURCE,
    collection: {
      id: `xhs:board:${boardId}`,
      sourceUrl,
      title: readCollectionTitle(document) ?? "小红书收藏夹",
      coverUrl: item.coverUrl
    },
    items: [item]
  }
}

function extractCard(card: QueryableElement, boardId: string) {
  const noteLink = findNoteLink(card, boardId)
  if (!noteLink) {
    return undefined
  }

  const noteHref = requireValue(
    noteLink.getAttribute("href"),
    "Missing note href"
  )
  const noteId = requireValue(readNoteId(noteHref, boardId), "Missing note id")
  const authorLink = card.querySelector('a[href^="/user/profile/"]')
  const authorHref = authorLink?.getAttribute("href") ?? undefined
  const authorId = authorHref ? readAuthorId(authorHref) : undefined
  const authorName = cleanText(authorLink?.textContent)
  const avatarUrl = readAttribute(
    card.querySelector('img[src*="sns-avatar"]'),
    "src"
  )

  return {
    id: `xhs:note:${noteId}`,
    title: cleanText(noteLink.textContent) ?? `小红书笔记 ${noteId}`,
    noteUrl: toAbsoluteUrl(noteHref),
    coverUrl: readAttribute(
      card.querySelector('img[src*="sns-webpic"]'),
      "src"
    ),
    mediaType: card.querySelector('[class*="play"]') ? "video" : "image",
    author:
      authorId || authorName || avatarUrl || authorHref
        ? {
            id: authorId ? `xhs:author:${authorId}` : undefined,
            name: authorName ?? "未知作者",
            avatarUrl,
            profileUrl: authorHref ? toAbsoluteUrl(authorHref) : undefined
          }
        : undefined
  } as const
}

function findNoteLink(
  card: QueryableElement,
  boardId: string
): QueryableElement | undefined {
  const links = queryAll(card, `a[href^="/board/${boardId}/"]`)
  return links.find((link) => Boolean(cleanText(link.textContent))) ?? links[0]
}

function readBoardId(url: string | undefined): string | undefined {
  if (!url) {
    return undefined
  }
  return readPathname(url).match(BOARD_PATH_PATTERN)?.[1]
}

function readNoteId(href: string, boardId: string): string | undefined {
  const pattern = new RegExp(`^/board/${escapeRegExp(boardId)}/([^/?#]+)`)
  return readPathname(href).match(pattern)?.[1]
}

function readAuthorId(href: string): string | undefined {
  return readPathname(href).match(/^\/user\/profile\/([^/?#]+)/)?.[1]
}

function readPathname(value: string): string {
  try {
    return new URL(value, XHS_ORIGIN).pathname
  } catch {
    return value
  }
}

function readCollectionTitle(document: {
  querySelector(selector: string): QueryableElement | null
}) {
  const title =
    cleanText(document.querySelector('a[href*="subTab=board"]')?.textContent) ??
    cleanText(document.querySelector("h1")?.textContent)
  return title
}

function queryAll(
  element: {
    querySelectorAll(
      selector: string
    ): Iterable<QueryableElement> | ArrayLike<QueryableElement>
  },
  selector: string
): QueryableElement[] {
  return Array.from(element.querySelectorAll(selector))
}

function readAttribute(
  element: QueryableElement | null,
  name: string
): string | undefined {
  const value = element?.getAttribute(name)?.trim()
  return value ? value : undefined
}

function cleanText(value: string | null | undefined): string | undefined {
  const text = value?.replace(/\s+/g, " ").trim()
  return text ? text : undefined
}

function toAbsoluteUrl(href: string): string {
  return new URL(href, XHS_ORIGIN).toString()
}

function requireValue<T>(value: T | undefined | null, message: string): T {
  if (value === undefined || value === null || value === "") {
    throw new Error(message)
  }
  return value
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
