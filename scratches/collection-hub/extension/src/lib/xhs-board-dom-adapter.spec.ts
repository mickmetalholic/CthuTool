import { describe, expect, it } from "vitest"

import {
  extractXhsBoardCardDraft,
  xhsBoardDomAdapter
} from "./xhs-board-dom-adapter"

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
    if (selector === ".note-item") {
      return hasClass(this.attributes.class, "note-item")
    }
    if (selector === 'img[src*="sns-webpic"]') {
      return (
        this.tagName === "img" && this.attributes.src?.includes("sns-webpic")
      )
    }
    if (selector === 'img[src*="sns-avatar"]') {
      return (
        this.tagName === "img" && this.attributes.src?.includes("sns-avatar")
      )
    }
    if (selector === 'a[href^="/user/profile/"]') {
      return (
        this.tagName === "a" &&
        this.attributes.href?.startsWith("/user/profile/")
      )
    }
    if (selector.startsWith('a[href^="/board/')) {
      const prefix = selector.slice('a[href^="'.length, -2)
      return this.tagName === "a" && this.attributes.href?.startsWith(prefix)
    }
    if (selector === '[class*="play"]') {
      return this.attributes.class?.includes("play") ?? false
    }
    return false
  }
}

class FakeDocument extends FakeElement {
  public readonly title = "Inbox - 小红书"
  public readonly location = {
    href: "https://www.xiaohongshu.com/board/66e96792000000001703f977?source=web_user_page"
  }

  constructor(children: FakeElement[]) {
    super("document", {}, children)
  }
}

describe("xhsBoardDomAdapter", () => {
  it("extracts visible board cards with cover, author avatar, urls, ids, source, and media type", () => {
    const firstCard = card({
      noteId: "69ffcb5a000000001002d000",
      title: "🔥 12KB搞定一个完整Web终端",
      coverUrl: "https://sns-webpic-qc.xhscdn.com/cover-1!nc_n_webp_mw_1",
      authorId: "5f93cf78000000000101ddd7",
      authorName: "小所看世界",
      authorAvatarUrl: "https://sns-avatar-qc.xhscdn.com/avatar/author-1.jpg",
      video: true
    })
    const document = new FakeDocument([
      firstCard,
      card({
        noteId: "6a01925f000000000702f0df",
        title: "我最喜欢的MacOS 应用程序和扩展",
        coverUrl: "https://sns-webpic-qc.xhscdn.com/cover-2!nc_n_webp_mw_1",
        authorId: "58a940ed50c4b4590b7724c0",
        authorName: "刘韬Talk",
        authorAvatarUrl: "https://sns-avatar-qc.xhscdn.com/avatar/author-2.jpg",
        video: false
      })
    ])

    expect(xhsBoardDomAdapter.canHandle(document)).toBe(true)
    const draft = xhsBoardDomAdapter.extract(document)

    expect(draft.source).toBe("xhs")
    expect(draft.collection).toMatchObject({
      id: "xhs:board:66e96792000000001703f977",
      title: "小红书收藏夹",
      sourceUrl:
        "https://www.xiaohongshu.com/board/66e96792000000001703f977?source=web_user_page",
      coverUrl: "https://sns-webpic-qc.xhscdn.com/cover-1!nc_n_webp_mw_1"
    })
    expect(draft.items).toEqual([
      expect.objectContaining({
        id: "xhs:note:69ffcb5a000000001002d000",
        title: "🔥 12KB搞定一个完整Web终端",
        noteUrl:
          "https://www.xiaohongshu.com/board/66e96792000000001703f977/69ffcb5a000000001002d000?xsec_token=token&xsec_source=",
        coverUrl: "https://sns-webpic-qc.xhscdn.com/cover-1!nc_n_webp_mw_1",
        mediaType: "video",
        author: {
          id: "xhs:author:5f93cf78000000000101ddd7",
          name: "小所看世界",
          avatarUrl: "https://sns-avatar-qc.xhscdn.com/avatar/author-1.jpg",
          profileUrl:
            "https://www.xiaohongshu.com/user/profile/5f93cf78000000000101ddd7?channel_type=web_board_page"
        }
      }),
      expect.objectContaining({
        id: "xhs:note:6a01925f000000000702f0df",
        mediaType: "image",
        author: expect.objectContaining({
          id: "xhs:author:58a940ed50c4b4590b7724c0"
        })
      })
    ])

    const singleCardDraft = extractXhsBoardCardDraft(document, firstCard)
    expect(singleCardDraft?.items).toHaveLength(1)
    expect(singleCardDraft?.items[0]).toMatchObject({
      id: "xhs:note:69ffcb5a000000001002d000",
      title: "🔥 12KB搞定一个完整Web终端"
    })
  })
})

function card({
  authorAvatarUrl,
  authorId,
  authorName,
  coverUrl,
  noteId,
  title,
  video
}: {
  authorAvatarUrl: string
  authorId: string
  authorName: string
  coverUrl: string
  noteId: string
  title: string
  video: boolean
}) {
  const noteHref = `/board/66e96792000000001703f977/${noteId}?xsec_token=token&xsec_source=`
  const authorHref = `/user/profile/${authorId}?channel_type=web_board_page`

  return new FakeElement("section", { class: "note-item" }, [
    new FakeElement("a", { href: noteHref }, [
      new FakeElement("img", { src: coverUrl })
    ]),
    video
      ? new FakeElement("span", { class: "play-icon" })
      : new FakeElement("span"),
    new FakeElement("a", { href: noteHref }, [], title),
    new FakeElement("a", { href: authorHref }, [
      new FakeElement("img", { src: authorAvatarUrl, class: "reds-img" }),
      new FakeElement("span", {}, [], authorName)
    ])
  ])
}

function hasClass(value: string | undefined, className: string): boolean {
  return value?.split(/\s+/).includes(className) ?? false
}
