import { describe, expect, it } from "vitest"

import { bilibiliFavlistDomAdapter } from "./bilibili-favlist-dom-adapter"

class FakeElement {
  public readonly textContent: string | null

  constructor(
    private readonly tagName: string,
    private readonly attributes: Record<string, string> = {},
    private readonly children: FakeElement[] = [],
    textContent?: string
  ) {
    this.textContent =
      textContent ??
      children
        .map((child) => child.textContent)
        .filter(Boolean)
        .join("")
  }

  getAttribute(name: string) {
    return this.attributes[name] ?? null
  }

  querySelector(selector: string) {
    return this.querySelectorAll(selector)[0] ?? null
  }

  querySelectorAll(selector: string): FakeElement[] {
    const matches: FakeElement[] = []
    for (const element of this.walk()) {
      if (element !== this && element.matches(selector)) {
        matches.push(element)
      }
    }
    return matches
  }

  private *walk(): Iterable<FakeElement> {
    yield this
    for (const child of this.children) {
      yield* child.walk()
    }
  }

  private matches(selector: string): boolean {
    if (selector === ".items__item") {
      return hasClass(this.attributes.class, "items__item")
    }
    if (selector === ".bili-video-card") {
      return hasClass(this.attributes.class, "bili-video-card")
    }
    if (selector === ".fav-list-title") {
      return hasClass(this.attributes.class, "fav-list-title")
    }
    if (selector === "h1") {
      return this.tagName === "h1"
    }
    if (selector === "img") {
      return this.tagName === "img"
    }
    if (selector === "div.bili-video-card__title") {
      return (
        this.tagName === "div" &&
        hasClass(this.attributes.class, "bili-video-card__title")
      )
    }
    if (selector === 'a[href*="/video/BV"]') {
      return (
        this.tagName === "a" &&
        Boolean(this.attributes.href?.includes("/video/BV"))
      )
    }
    if (selector === 'a[href*="space.bilibili.com"]') {
      return (
        this.tagName === "a" &&
        Boolean(this.attributes.href?.includes("space.bilibili.com"))
      )
    }
    return false
  }
}

class FakeDocument extends FakeElement {
  public readonly title = "18号机库Studio的个人空间-哔哩哔哩"

  constructor(
    children: FakeElement[],
    public readonly location = {
      href: "https://space.bilibili.com/5059047/favlist?fid=47314147"
    }
  ) {
    super("document", {}, children)
  }
}

describe("bilibiliFavlistDomAdapter", () => {
  it("detects canonical favlist URLs", () => {
    expect(bilibiliFavlistDomAdapter.canHandle(new FakeDocument([]))).toBe(true)
  })

  it("detects observed rewritten space URLs when Bilibili favlist cards are present", () => {
    const document = new FakeDocument([card({ bvid: "BV1CZ4y1T7gC" })], {
      href: "https://space.bilibili.com/5059047?fid=47314147"
    })

    expect(bilibiliFavlistDomAdapter.canHandle(document)).toBe(true)
  })

  it("detects observed rewritten space URLs with fid before cards finish rendering", () => {
    const document = new FakeDocument([], {
      href: "https://space.bilibili.com/5059047?fid=47314147"
    })

    expect(bilibiliFavlistDomAdapter.canHandle(document)).toBe(true)
  })

  it("extracts collection metadata, canonical video items, covers, and authors", () => {
    const document = new FakeDocument([
      new FakeElement("h1", { class: "fav-list-title" }, [], "猛 男 生 存"),
      card({
        authorId: "686127",
        authorName: "籽岷",
        bvid: "BV1CZ4y1T7gC",
        coverUrl: "//i2.hdslb.com/bfs/archive/cover-1.jpg@672w_378h_1c.webp",
        title: "猛 男 生 存 1"
      }),
      card({
        authorId: "686127",
        authorName: "籽岷",
        bvid: "BV1oA411a72k",
        coverUrl: "http://i1.hdslb.com/bfs/archive/cover-2.jpg",
        title: "猛 男 生 存 2"
      })
    ])

    const draft = bilibiliFavlistDomAdapter.extract(document)

    expect(draft.source).toBe("bilibili")
    expect(draft.collection).toMatchObject({
      id: "bilibili:favlist:47314147",
      title: "猛 男 生 存",
      sourceUrl: "https://space.bilibili.com/5059047/favlist?fid=47314147",
      coverUrl: "https://i2.hdslb.com/bfs/archive/cover-1.jpg@672w_378h_1c.webp"
    })
    expect(draft.items).toEqual([
      {
        id: "bilibili:video:BV1CZ4y1T7gC",
        title: "猛 男 生 存 1",
        noteUrl: "https://www.bilibili.com/video/BV1CZ4y1T7gC",
        coverUrl:
          "https://i2.hdslb.com/bfs/archive/cover-1.jpg@672w_378h_1c.webp",
        mediaType: "video",
        author: {
          id: "bilibili:author:686127",
          name: "籽岷",
          profileUrl: "https://space.bilibili.com/686127"
        }
      },
      expect.objectContaining({
        id: "bilibili:video:BV1oA411a72k",
        noteUrl: "https://www.bilibili.com/video/BV1oA411a72k",
        coverUrl: "https://i1.hdslb.com/bfs/archive/cover-2.jpg",
        mediaType: "video"
      })
    ])
  })

  it("deduplicates repeated BV links in one card and skips cards without BV links", () => {
    const document = new FakeDocument([
      card({
        bvid: "BV1CZ4y1T7gC",
        duplicateVideoLink: true
      }),
      new FakeElement("div", { class: "items__item bili-video-card" }, [
        new FakeElement("a", { href: "//space.bilibili.com/686127" }, [], "籽岷")
      ])
    ])

    expect(bilibiliFavlistDomAdapter.extract(document).items).toHaveLength(1)
  })

  it("throws a Bilibili empty-page error when no importable video cards exist", () => {
    const document = new FakeDocument([
      new FakeElement("div", { class: "items__item bili-video-card" })
    ])

    expect(() => bilibiliFavlistDomAdapter.extract(document)).toThrow(
      "当前 Bilibili 收藏夹没有可导入的视频卡片"
    )
  })

  it("uses the MID fallback collection ID when the rewritten URL lacks fid", () => {
    const document = new FakeDocument([card({ bvid: "BV1CZ4y1T7gC" })], {
      href: "https://space.bilibili.com/5059047"
    })

    expect(bilibiliFavlistDomAdapter.extract(document).collection.id).toBe(
      "bilibili:favlist:5059047"
    )
  })
})

function card({
  authorId = "686127",
  authorName = "籽岷",
  bvid,
  coverUrl = "//i2.hdslb.com/bfs/archive/cover.jpg",
  duplicateVideoLink = false,
  title = "猛 男 生 存"
}: {
  authorId?: string
  authorName?: string
  bvid: string
  coverUrl?: string
  duplicateVideoLink?: boolean
  title?: string
}) {
  const videoHref = `//www.bilibili.com/video/${bvid}/?spm_id_from=333.999`
  return new FakeElement("div", { class: "items__item" }, [
    new FakeElement("div", { class: "bili-video-card" }, [
      new FakeElement("a", { href: videoHref }, [
        new FakeElement("img", { src: coverUrl })
      ]),
      duplicateVideoLink
        ? new FakeElement("a", { href: videoHref }, [], "重复视频链接")
        : new FakeElement("span"),
      new FakeElement("div", { class: "bili-video-card__details" }, [
        new FakeElement("a", { href: videoHref }, [
          new FakeElement(
            "div",
            { class: "bili-video-card__title" },
            [],
            title
          )
        ]),
        new FakeElement(
          "a",
          { href: `//space.bilibili.com/${authorId}` },
          [],
          authorName
        )
      ])
    ])
  ])
}

function hasClass(value: string | undefined, className: string): boolean {
  return value?.split(/\s+/).includes(className) ?? false
}
