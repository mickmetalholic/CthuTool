import type {
  CollectionExtractionDraft,
  DomCollectionAdapter,
  QueryableDocument,
  QueryableElement
} from "./dom-adapter"

const BILIBILI_SOURCE = "bilibili"
const BILIBILI_ORIGIN = "https://www.bilibili.com"
const BILIBILI_SPACE_ORIGIN = "https://space.bilibili.com"
const BILIBILI_CARD_SELECTORS = [".items__item", ".bili-video-card"] as const
const BVID_PATTERN = /BV[0-9A-Za-z]+/

export const bilibiliFavlistDomAdapter: DomCollectionAdapter = {
  id: "bilibili-favlist-dom-adapter",

  canHandle(document) {
    const identity = readFavlistIdentity(document.location?.href)
    if (!identity) {
      return false
    }

    return (
      identity.isCanonicalFavlist ||
      Boolean(identity.fid) ||
      hasBilibiliVideoCards(document)
    )
  },

  extract(document) {
    const identity = requireValue(
      readFavlistIdentity(document.location?.href),
      "当前页面不是 Bilibili 收藏夹"
    )
    const sourceUrl =
      document.location?.href ??
      `${BILIBILI_SPACE_ORIGIN}/${identity.mid}/favlist`
    const cards = queryBilibiliCards(document)
    const seenBvids = new Set<string>()
    const items = cards
      .map((card) => extractCard(card))
      .filter((item): item is NonNullable<ReturnType<typeof extractCard>> =>
        Boolean(item)
      )
      .filter((item) => {
        if (seenBvids.has(item.id)) {
          return false
        }
        seenBvids.add(item.id)
        return true
      })

    if (items.length === 0) {
      throw new Error("当前 Bilibili 收藏夹没有可导入的视频卡片")
    }

    return {
      source: BILIBILI_SOURCE,
      collection: {
        id: `bilibili:favlist:${identity.fid ?? identity.mid}`,
        sourceUrl,
        title: readCollectionTitle(document) ?? "Bilibili 收藏夹",
        coverUrl: items[0]?.coverUrl
      },
      items
    }
  }
}

function extractCard(card: QueryableElement) {
  const videoLinks = queryAll(card, 'a[href*="/video/BV"]')
  const bvid = videoLinks
    .map((link) => readBvid(link.getAttribute("href")))
    .find((candidate): candidate is string => Boolean(candidate))
  if (!bvid) {
    return undefined
  }

  const authorLink = card.querySelector('a[href*="space.bilibili.com"]')
  const authorHref = authorLink?.getAttribute("href") ?? undefined
  const authorId = authorHref ? readSpaceMid(authorHref) : undefined
  const authorName = cleanText(authorLink?.textContent)
  const coverUrl = normalizeHttpsUrl(
    readAttribute(card.querySelector("img"), "src") ??
      readAttribute(card.querySelector("img"), "data-src")
  )

  return {
    id: `bilibili:video:${bvid}`,
    title:
      cleanText(card.querySelector("div.bili-video-card__title")?.textContent) ??
      cleanText(videoLinks[0]?.textContent) ??
      `Bilibili 视频 ${bvid}`,
    noteUrl: `${BILIBILI_ORIGIN}/video/${bvid}`,
    coverUrl,
    mediaType: "video",
    author:
      authorId || authorName || authorHref
        ? {
            id: authorId ? `bilibili:author:${authorId}` : undefined,
            name: authorName ?? "未知 UP 主",
            profileUrl: authorHref ? normalizeSpaceUrl(authorHref) : undefined
          }
        : undefined
  } as const
}

function hasBilibiliVideoCards(document: QueryableDocument): boolean {
  return queryBilibiliCards(document).some((card) =>
    Boolean(card.querySelector('a[href*="/video/BV"]'))
  )
}

function queryBilibiliCards(document: QueryableDocument): QueryableElement[] {
  const cards = new Set<QueryableElement>()
  for (const selector of BILIBILI_CARD_SELECTORS) {
    for (const card of queryAll(document, selector)) {
      cards.add(card)
    }
  }
  return Array.from(cards)
}

function readFavlistIdentity(url: string | undefined) {
  if (!url) {
    return undefined
  }

  try {
    const parsed = new URL(url, BILIBILI_SPACE_ORIGIN)
    if (parsed.hostname !== "space.bilibili.com") {
      return undefined
    }
    const mid = readSpaceMid(parsed.toString())
    if (!mid) {
      return undefined
    }
    return {
      fid: parsed.searchParams.get("fid") ?? undefined,
      isCanonicalFavlist: /^\/\d+\/favlist\/?$/.test(parsed.pathname),
      mid
    }
  } catch {
    return undefined
  }
}

function readBvid(href: string | null | undefined): string | undefined {
  if (!href) {
    return undefined
  }
  return href.match(BVID_PATTERN)?.[0]
}

function readSpaceMid(href: string): string | undefined {
  try {
    return new URL(href, BILIBILI_SPACE_ORIGIN).pathname.match(/^\/(\d+)/)?.[1]
  } catch {
    return href.match(/space\.bilibili\.com\/(\d+)/)?.[1]
  }
}

function readCollectionTitle(document: QueryableDocument): string | undefined {
  return (
    cleanText(document.querySelector(".fav-list-title")?.textContent) ??
    cleanText(document.querySelector("h1")?.textContent)
  )
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

function normalizeSpaceUrl(href: string): string {
  const url = new URL(href, BILIBILI_SPACE_ORIGIN)
  url.protocol = "https:"
  return url.toString()
}

function normalizeHttpsUrl(href: string | undefined): string | undefined {
  if (!href) {
    return undefined
  }

  const url = new URL(href, BILIBILI_ORIGIN)
  url.protocol = "https:"
  return url.toString()
}

function requireValue<T>(value: T | undefined | null, message: string): T {
  if (value === undefined || value === null || value === "") {
    throw new Error(message)
  }
  return value
}
