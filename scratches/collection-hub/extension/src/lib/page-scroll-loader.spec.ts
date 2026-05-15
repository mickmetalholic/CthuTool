import { describe, expect, it } from "vitest"

import {
  extractCollectionWhileScrolling,
  scrollUntilLazyItemsLoaded
} from "./page-scroll-loader"

class FakeDocument {
  public readonly body = { scrollHeight: 0 }
  public readonly documentElement = { scrollHeight: 0 }
  public elements: FakeScrollableElement[] = []

  constructor(
    private readonly snapshots: Array<{
      itemCount: number
      scrollHeight: number
    }>,
    private readonly getIndex: () => number
  ) {}

  querySelectorAll(selector: string) {
    if (selector === "*") {
      return this.elements
    }

    if (selector !== ".note-item") {
      return []
    }

    return Array.from({
      length: this.snapshots[this.getIndex()]?.itemCount ?? 0
    })
  }

  readScrollHeight() {
    return this.snapshots[this.getIndex()]?.scrollHeight ?? 0
  }
}

class FakeScrollableElement {
  public readonly scrollTargets: number[] = []
  public scrollTop = 0

  constructor(
    public readonly dimensions: {
      clientHeight: number
      scrollHeight: number
    }
  ) {}

  get clientHeight() {
    return this.dimensions.clientHeight
  }

  get scrollHeight() {
    return this.dimensions.scrollHeight
  }

  scrollTo(options: ScrollToOptions) {
    const target = Number(options.top ?? 0)
    this.scrollTargets.push(target)
    this.scrollTop = target
  }
}

class FakeBlockedScrollableElement extends FakeScrollableElement {
  scrollTo(options: ScrollToOptions) {
    const target = Number(options.top ?? 0)
    this.scrollTargets.push(target)
  }
}

class FakeWindow {
  public readonly scrollTargets: number[] = []
  public scrollY = 0

  constructor(private readonly advanceSnapshot: () => void) {}

  scrollTo(options: ScrollToOptions) {
    const target = Number(options.top ?? 0)
    this.scrollTargets.push(target)
    this.scrollY = target
    this.advanceSnapshot()
  }
}

describe("scrollUntilLazyItemsLoaded", () => {
  it("scrolls to the bottom until item count and page height settle", async () => {
    const snapshots = [
      { itemCount: 2, scrollHeight: 1000 },
      { itemCount: 5, scrollHeight: 1800 },
      { itemCount: 8, scrollHeight: 2400 },
      { itemCount: 8, scrollHeight: 2400 },
      { itemCount: 8, scrollHeight: 2400 }
    ]
    let snapshotIndex = 0
    const document = new FakeDocument(snapshots, () => snapshotIndex)
    document.body.scrollHeight = document.readScrollHeight()
    document.documentElement.scrollHeight = document.readScrollHeight()

    const window = new FakeWindow(() => {
      snapshotIndex = Math.min(snapshotIndex + 1, snapshots.length - 1)
      document.body.scrollHeight = document.readScrollHeight()
      document.documentElement.scrollHeight = document.readScrollHeight()
    })

    const result = await scrollUntilLazyItemsLoaded({
      delayMs: 0,
      document,
      stableRounds: 2,
      wait: async () => undefined,
      window
    })

    expect(window.scrollTargets).toEqual([1000, 1800, 2400, 2400])
    expect(result).toEqual({
      completed: true,
      itemCount: 8,
      scrollHeight: 2400,
      scrolls: 4
    })
  })
})

describe("extractCollectionWhileScrolling", () => {
  it("keeps items collected from prior virtualized list windows", async () => {
    const scrollable = new FakeScrollableElement({
      clientHeight: 100,
      scrollHeight: 300
    })
    const document = new FakeDocument(
      [{ itemCount: 2, scrollHeight: 300 }],
      () => 0
    )
    document.body.scrollHeight = 300
    document.documentElement.scrollHeight = 300
    document.elements = [scrollable]

    const batches = [["note-1", "note-2"], ["note-3", "note-4"], ["note-5"]]
    const extract = () => {
      const batchIndex = Math.min(
        Math.floor(scrollable.scrollTop / scrollable.clientHeight),
        batches.length - 1
      )

      return {
        source: "xhs",
        collection: {
          id: "xhs:board:demo",
          sourceUrl: "https://www.xiaohongshu.com/board/demo",
          title: "Demo board"
        },
        items: batches[batchIndex].map((id) => ({
          id: `xhs:note:${id}`,
          noteUrl: `https://www.xiaohongshu.com/board/demo/${id}`,
          title: id
        }))
      }
    }

    const result = await extractCollectionWhileScrolling({
      delayMs: 0,
      document,
      extract,
      maxScrolls: 10,
      stableRounds: 1,
      wait: async () => undefined,
      window: new FakeWindow(() => undefined)
    })

    expect(result.items.map((item) => item.id)).toEqual([
      "xhs:note:note-1",
      "xhs:note:note-2",
      "xhs:note:note-3",
      "xhs:note:note-4",
      "xhs:note:note-5"
    ])
  })

  it("uses dense overlapping scroll steps so virtualized windows are not skipped", async () => {
    const scrollable = new FakeScrollableElement({
      clientHeight: 100,
      scrollHeight: 300
    })
    const document = new FakeDocument(
      [{ itemCount: 1, scrollHeight: 300 }],
      () => 0
    )
    document.elements = [scrollable]

    const extract = () => {
      const batchIndex = Math.min(Math.floor(scrollable.scrollTop / 50), 4)

      return {
        source: "xhs",
        collection: {
          id: "xhs:board:demo",
          sourceUrl: "https://www.xiaohongshu.com/board/demo",
          title: "Demo board"
        },
        items: [
          {
            id: `xhs:note:note-${batchIndex}`,
            noteUrl: `https://www.xiaohongshu.com/board/demo/note-${batchIndex}`,
            title: `note-${batchIndex}`
          }
        ]
      }
    }

    const result = await extractCollectionWhileScrolling({
      delayMs: 0,
      document,
      extract,
      maxScrolls: 10,
      stableRounds: 1,
      wait: async () => undefined,
      window: new FakeWindow(() => undefined)
    })

    expect(result.items.map((item) => item.id)).toEqual([
      "xhs:note:note-0",
      "xhs:note:note-1",
      "xhs:note:note-2",
      "xhs:note:note-3",
      "xhs:note:note-4"
    ])
  })

  it("starts from the top before collecting so prior scroll position does not hide earlier items", async () => {
    const scrollable = new FakeScrollableElement({
      clientHeight: 100,
      scrollHeight: 300
    })
    scrollable.scrollTop = 100
    const document = new FakeDocument(
      [{ itemCount: 1, scrollHeight: 300 }],
      () => 0
    )
    document.elements = [scrollable]

    const extract = () => {
      const batchIndex = Math.min(Math.floor(scrollable.scrollTop / 100), 2)

      return {
        source: "xhs",
        collection: {
          id: "xhs:board:demo",
          sourceUrl: "https://www.xiaohongshu.com/board/demo",
          title: "Demo board"
        },
        items: [
          {
            id: `xhs:note:note-${batchIndex}`,
            noteUrl: `https://www.xiaohongshu.com/board/demo/note-${batchIndex}`,
            title: `note-${batchIndex}`
          }
        ]
      }
    }

    const result = await extractCollectionWhileScrolling({
      delayMs: 0,
      document,
      extract,
      maxScrolls: 10,
      stableRounds: 1,
      wait: async () => undefined,
      window: new FakeWindow(() => undefined)
    })

    expect(scrollable.scrollTargets[0]).toBe(0)
    expect(result.items.map((item) => item.id)).toEqual([
      "xhs:note:note-0",
      "xhs:note:note-1",
      "xhs:note:note-2"
    ])
  })

  it("uses short waits while scanning so no-growth pages finish quickly", async () => {
    const scrollable = new FakeScrollableElement({
      clientHeight: 100,
      scrollHeight: 200
    })
    const document = new FakeDocument(
      [{ itemCount: 1, scrollHeight: 200 }],
      () => 0
    )
    document.elements = [scrollable]
    const waits: number[] = []

    await extractCollectionWhileScrolling({
      document,
      extract: () => ({
        source: "xhs",
        collection: {
          id: "xhs:board:demo",
          sourceUrl: "https://www.xiaohongshu.com/board/demo",
          title: "Demo board"
        },
        items: [
          {
            id: "xhs:note:note-1",
            noteUrl: "https://www.xiaohongshu.com/board/demo/note-1",
            title: "note-1"
          }
        ]
      }),
      wait: async (delayMs) => {
        waits.push(delayMs)
      },
      window: new FakeWindow(() => undefined)
    })

    expect(waits.every((delayMs) => delayMs <= 120)).toBe(true)
    expect(waits.length).toBeLessThan(30)
  })

  it("keeps scrolling through a temporary no-growth plateau", async () => {
    const scrollable = new FakeScrollableElement({
      clientHeight: 100,
      scrollHeight: 500
    })
    const document = new FakeDocument(
      [{ itemCount: 1, scrollHeight: 500 }],
      () => 0
    )
    document.elements = [scrollable]

    const result = await extractCollectionWhileScrolling({
      delayMs: 0,
      document,
      extract: () => {
        const suffix = scrollable.scrollTop < 200 ? "early" : "late"

        return {
          source: "xhs",
          collection: {
            id: "xhs:board:demo",
            sourceUrl: "https://www.xiaohongshu.com/board/demo",
            title: "Demo board"
          },
          items: [
            {
              id: `xhs:note:${suffix}`,
              noteUrl: `https://www.xiaohongshu.com/board/demo/${suffix}`,
              title: suffix
            }
          ]
        }
      },
      maxNoGrowthRounds: 3,
      maxScrolls: 20,
      stableRounds: 1,
      wait: async () => undefined,
      window: new FakeWindow(() => undefined)
    })

    expect(result.items.map((item) => item.id)).toEqual([
      "xhs:note:early",
      "xhs:note:late"
    ])
  })

  it("continues past the old default scroll cap when the list is very long", async () => {
    const scrollable = new FakeScrollableElement({
      clientHeight: 100,
      scrollHeight: 10000
    })
    const document = new FakeDocument(
      [{ itemCount: 1, scrollHeight: 10000 }],
      () => 0
    )
    document.elements = [scrollable]

    const result = await extractCollectionWhileScrolling({
      delayMs: 0,
      document,
      extract: () => {
        const suffix = scrollable.scrollTop < 9500 ? "early" : "late"

        return {
          source: "xhs",
          collection: {
            id: "xhs:board:demo",
            sourceUrl: "https://www.xiaohongshu.com/board/demo",
            title: "Demo board"
          },
          items: [
            {
              id: `xhs:note:${suffix}`,
              noteUrl: `https://www.xiaohongshu.com/board/demo/${suffix}`,
              title: suffix
            }
          ]
        }
      },
      stableRounds: 1,
      wait: async () => undefined,
      window: new FakeWindow(() => undefined)
    })

    expect(result.items.map((item) => item.id)).toEqual([
      "xhs:note:early",
      "xhs:note:late"
    ])
    expect(scrollable.scrollTargets.length).toBeGreaterThan(360)
  })

  it("stops when a scroll candidate accepts scrollTo but does not move", async () => {
    const scrollable = new FakeBlockedScrollableElement({
      clientHeight: 100,
      scrollHeight: 500
    })
    const document = new FakeDocument(
      [{ itemCount: 1, scrollHeight: 500 }],
      () => 0
    )
    document.elements = [scrollable]
    const waits: number[] = []

    await extractCollectionWhileScrolling({
      delayMs: 0,
      document,
      extract: () => ({
        source: "xhs",
        collection: {
          id: "xhs:board:demo",
          sourceUrl: "https://www.xiaohongshu.com/board/demo",
          title: "Demo board"
        },
        items: [
          {
            id: "xhs:note:note-1",
            noteUrl: "https://www.xiaohongshu.com/board/demo/note-1",
            title: "note-1"
          }
        ]
      }),
      maxNoGrowthRounds: 2,
      maxScrolls: 12,
      stableRounds: 2,
      wait: async (delayMs) => {
        waits.push(delayMs)
      },
      window: new FakeWindow(() => undefined)
    })

    expect(waits.length).toBeLessThan(6)
    expect(scrollable.scrollTop).toBe(0)
  })

  it("reports collected item progress during scrolling", async () => {
    const scrollable = new FakeScrollableElement({
      clientHeight: 100,
      scrollHeight: 200
    })
    const document = new FakeDocument(
      [{ itemCount: 1, scrollHeight: 200 }],
      () => 0
    )
    document.elements = [scrollable]
    const progressCounts: number[] = []

    await extractCollectionWhileScrolling({
      delayMs: 0,
      document,
      extract: () => ({
        source: "xhs",
        collection: {
          id: "xhs:board:demo",
          sourceUrl: "https://www.xiaohongshu.com/board/demo",
          title: "Demo board"
        },
        items: [
          {
            id: `xhs:note:note-${Math.floor(scrollable.scrollTop / 100)}`,
            noteUrl: `https://www.xiaohongshu.com/board/demo/note-${Math.floor(
              scrollable.scrollTop / 100
            )}`,
            title: "note"
          }
        ]
      }),
      onProgress: (progress) => {
        progressCounts.push(progress.itemCount)
      },
      wait: async () => undefined,
      window: new FakeWindow(() => undefined)
    })

    expect(progressCounts).toContain(1)
    expect(progressCounts).toContain(2)
  })
})
