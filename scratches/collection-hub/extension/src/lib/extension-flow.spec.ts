import {
  parseImportCollectionRequest,
  type ImportCollectionRequest
} from "@collection-hub/libs"
import { describe, expect, it } from "vitest"

import {
  buildDeleteItemsRequest,
  buildImportRequest,
  buildImportRequestBatches,
  buildSingleItemImportRequest,
  submitDeleteItemsRequestViaExtension,
  submitDeleteItemsRequest,
  submitImportRequest,
  submitImportRequestInBatches,
  submitImportRequestViaExtension
} from "./import-client"
import { isUrlAllowed } from "./match-patterns"
import { sampleDomAdapter } from "./sample-dom-adapter"
import { defaultExtensionSettings, normalizeSettings } from "./settings"

class FakeElement {
  constructor(
    private readonly attributes: Record<string, string> = {},
    private readonly children: Record<string, FakeElement> = {},
    public readonly textContent: string | null = null
  ) {}

  getAttribute(name: string) {
    return this.attributes[name] ?? null
  }

  querySelector(selector: string) {
    return this.children[selector] ?? null
  }

  querySelectorAll(selector: string) {
    const child = this.querySelector(selector)
    return child ? [child] : []
  }
}

class FakeDocument {
  public readonly title = "Example Collection"
  public readonly location = { href: "https://example.test/collections/1" }

  constructor(
    private readonly collection: FakeElement,
    private readonly items: FakeElement[]
  ) {}

  querySelector(selector: string) {
    if (selector === "[data-xhs-collection]") {
      return this.collection
    }
    return null
  }

  querySelectorAll(selector: string) {
    if (selector === "[data-xhs-item]") {
      return this.items
    }
    return []
  }
}

describe("extension organizer flow", () => {
  it("normalizes settings and checks configured match patterns", () => {
    expect(normalizeSettings({})).toEqual(defaultExtensionSettings)
    expect(
      isUrlAllowed("https://example.test/collections/1", [
        "https://example.test/*"
      ])
    ).toBe(true)
    expect(
      isUrlAllowed("https://other.test/collections/1", [
        "https://example.test/*"
      ])
    ).toBe(false)
    expect(isUrlAllowed("http://localhost:3000/demo", ["<all_urls>"])).toBe(
      true
    )
  })

  it("extracts collection and item drafts through the sample DOM adapter", () => {
    const document = new FakeDocument(
      new FakeElement({
        "data-id": "collection-1",
        "data-title": "Saved notes",
        "data-cover-url": "https://example.test/cover.jpg"
      }),
      [
        new FakeElement(
          {
            "data-id": "note-1",
            "data-note-url": "https://example.test/notes/1",
            "data-cover-url": "https://example.test/notes/1.jpg"
          },
          {
            "[data-xhs-title]": new FakeElement({}, {}, "First note"),
            "[data-xhs-author]": new FakeElement({
              "data-id": "author-1",
              "data-name": "Alice",
              "data-profile-url": "https://example.test/users/alice"
            })
          }
        )
      ]
    )

    expect(sampleDomAdapter.canHandle(document)).toBe(true)
    const draft = sampleDomAdapter.extract(document)

    expect(draft.collection).toMatchObject({
      id: "collection-1",
      title: "Saved notes"
    })
    expect(draft.items[0]).toMatchObject({
      id: "note-1",
      title: "First note",
      author: { id: "author-1", name: "Alice" }
    })
  })

  it("builds a valid shared import request with the selected batch status", () => {
    const request = buildImportRequest(
      {
        source: "sample-dom-adapter",
        collection: {
          sourceUrl: "https://example.test/collections/1",
          title: "Saved notes"
        },
        items: [
          {
            title: "First note",
            noteUrl: "https://example.test/notes/1"
          }
        ]
      },
      "downloaded",
      "2026-05-12T15:30:00.000Z"
    )

    expect(request.status).toBe("downloaded")
    expect(parseImportCollectionRequest(request).success).toBe(true)
  })

  it("builds a single-note import request with only the selected item", () => {
    const draft = {
      source: "sample-dom-adapter",
      collection: {
        sourceUrl: "https://example.test/collections/1",
        title: "Saved notes"
      },
      items: [
        {
          id: "note-1",
          title: "First note",
          noteUrl: "https://example.test/notes/1"
        },
        {
          id: "note-2",
          title: "Second note",
          noteUrl: "https://example.test/notes/2"
        }
      ]
    }

    const request = buildSingleItemImportRequest(
      draft,
      draft.items[1],
      "not_downloaded",
      "2026-05-12T15:30:00.000Z"
    )

    expect(request).toMatchObject({
      source: "sample-dom-adapter",
      status: "not_downloaded",
      items: [draft.items[1]]
    })
    expect(parseImportCollectionRequest(request).success).toBe(true)
  })

  it("submits import payloads and surfaces API failures", async () => {
    const request = buildImportRequest(
      {
        source: "sample-dom-adapter",
        collection: {
          sourceUrl: "https://example.test/collections/1",
          title: "Saved notes"
        },
        items: [
          {
            title: "First note",
            noteUrl: "https://example.test/notes/1"
          }
        ]
      },
      "pending_download",
      "2026-05-12T15:30:00.000Z"
    )

    const summary = await submitImportRequest(
      "http://localhost:3001",
      request,
      {
        fetcher: async () =>
          new Response(
            JSON.stringify({
              collectionId: "collection-1",
              createdItems: 1,
              updatedItems: 0,
              authors: 0,
              updatedAt: "2026-05-12T15:30:00.000Z"
            }),
            { status: 200 }
          )
      }
    )

    await expect(
      submitImportRequest("http://localhost:3001", request, {
        fetcher: async () =>
          new Response(
            JSON.stringify({
              code: "VALIDATION_ERROR",
              message: "Invalid import payload"
            }),
            { status: 400 }
          )
      })
    ).rejects.toThrow("Invalid import payload")
    expect(summary.createdItems).toBe(1)
  })

  it("splits import requests into item batches", () => {
    const request = buildImportRequest(
      {
        source: "xhs",
        collection: {
          sourceUrl: "https://example.test/collections/1",
          title: "Saved notes"
        },
        items: Array.from({ length: 5 }, (_, index) => ({
          id: `note-${index + 1}`,
          title: `Note ${index + 1}`,
          noteUrl: `https://example.test/notes/${index + 1}`
        }))
      },
      "pending_download",
      "2026-05-12T15:30:00.000Z"
    )

    const batches = buildImportRequestBatches(request, {
      maxItemsPerBatch: 2
    })

    expect(batches.map((batch) => batch.items.map((item) => item.id))).toEqual([
      ["note-1", "note-2"],
      ["note-3", "note-4"],
      ["note-5"]
    ])
    expect(
      batches.every((batch) => batch.collection === request.collection)
    ).toBe(true)
  })

  it("splits import requests by approximate payload size", () => {
    const request = buildImportRequest(
      {
        source: "xhs",
        collection: {
          sourceUrl: "https://example.test/collections/1",
          title: "Saved notes"
        },
        items: Array.from({ length: 4 }, (_, index) => ({
          id: `large-note-${index + 1}`,
          title: `Large note ${index + 1}`,
          noteUrl: `https://example.test/notes/large-${index + 1}`,
          raw: {
            snapshot: "x".repeat(1400)
          }
        }))
      },
      "pending_download",
      "2026-05-12T15:30:00.000Z"
    )

    const batches = buildImportRequestBatches(request, {
      maxBatchBytes: 2600,
      maxItemsPerBatch: 50
    })

    expect(batches.length).toBeGreaterThan(1)
    expect(
      batches.flatMap((batch) => batch.items.map((item) => item.id))
    ).toEqual(["large-note-1", "large-note-2", "large-note-3", "large-note-4"])
  })

  it("submits import batches sequentially and merges summaries", async () => {
    const request = buildImportRequest(
      {
        source: "xhs",
        collection: {
          sourceUrl: "https://example.test/collections/1",
          title: "Saved notes"
        },
        items: Array.from({ length: 5 }, (_, index) => ({
          id: `note-${index + 1}`,
          title: `Note ${index + 1}`,
          noteUrl: `https://example.test/notes/${index + 1}`,
          author: {
            id: index % 2 === 0 ? "author-1" : "author-2",
            name: index % 2 === 0 ? "Alice" : "Bob"
          }
        }))
      },
      "pending_download",
      "2026-05-12T15:30:00.000Z"
    )
    const calls: ImportCollectionRequest[] = []
    const progress: number[] = []

    const summary = await submitImportRequestInBatches(
      "http://localhost:3001",
      request,
      {
        fetcher: async (_url, init) => {
          const body = JSON.parse(String(init?.body)) as typeof request
          calls.push(body)
          return new Response(
            JSON.stringify({
              collectionId: "xhs:pending_download",
              createdItems: body.items.length,
              updatedItems: 0,
              authors: 1,
              updatedAt: `2026-05-12T15:30:0${calls.length}.000Z`
            }),
            { status: 200 }
          )
        },
        maxItemsPerBatch: 2,
        onProgress: (nextProgress) => {
          progress.push(nextProgress.batchIndex)
        }
      }
    )

    expect(calls.map((call) => call.items.length)).toEqual([2, 2, 1])
    expect(progress).toEqual([1, 2, 3])
    expect(summary).toMatchObject({
      collectionId: "xhs:pending_download",
      createdItems: 5,
      updatedItems: 0,
      authors: 2
    })
  })

  it("submits status-scoped delete payloads for extracted item ids", async () => {
    const request = buildDeleteItemsRequest(
      {
        source: "xhs",
        collection: {
          sourceUrl: "https://example.test/collections/1",
          title: "Saved notes"
        },
        items: [
          {
            id: "note-1",
            title: "First note",
            noteUrl: "https://example.test/notes/1"
          },
          {
            title: "Missing id",
            noteUrl: "https://example.test/notes/missing-id"
          }
        ]
      },
      "downloaded"
    )
    const calls: Array<{ init?: RequestInit; url: string }> = []

    const summary = await submitDeleteItemsRequest(
      "http://localhost:3001",
      request,
      {
        fetcher: async (url, init) => {
          calls.push({ init, url: String(url) })
          return new Response(
            JSON.stringify({
              deletedItems: 1,
              skippedItems: 0,
              itemIds: ["note-1"],
              updatedAt: "2026-05-12T15:30:00.000Z"
            }),
            { status: 200 }
          )
        }
      }
    )

    expect(request).toEqual({
      source: "xhs",
      status: "downloaded",
      itemIds: ["note-1"]
    })
    expect(calls[0]).toMatchObject({
      url: "http://localhost:3001/api/dashboard/items/bulk-delete",
      init: {
        method: "POST"
      }
    })
    expect(summary.deletedItems).toBe(1)
  })

  it("sends local API requests through the extension runtime bridge", async () => {
    const request = buildImportRequest(
      {
        source: "bilibili",
        collection: {
          sourceUrl: "https://space.bilibili.com/1/favlist?fid=2",
          title: "收藏夹"
        },
        items: [
          {
            id: "bv-1",
            title: "Video",
            noteUrl: "https://www.bilibili.com/video/BV1"
          }
        ]
      },
      "pending_download",
      "2026-05-12T15:30:00.000Z"
    )
    const messages: unknown[] = []
    const runtime = {
      sendMessage: (
        message: unknown,
        callback: (response: unknown) => void
      ) => {
        messages.push(message)
        callback({
          ok: true,
          data: {
            collectionId: "bilibili:pending_download",
            createdItems: 1,
            updatedItems: 0,
            authors: 0,
            updatedAt: "2026-05-12T15:30:00.000Z"
          }
        })
      }
    }

    const summary = await submitImportRequestViaExtension(
      "http://localhost:3001",
      request,
      {
        runtime
      }
    )

    expect(messages[0]).toMatchObject({
      type: "collection-hub:submit-import",
      apiBaseUrl: "http://localhost:3001",
      request
    })
    expect(summary.createdItems).toBe(1)
  })

  it("surfaces extension runtime bridge failures", async () => {
    const request = buildDeleteItemsRequest(
      {
        source: "bilibili",
        collection: {
          sourceUrl: "https://space.bilibili.com/1/favlist?fid=2",
          title: "收藏夹"
        },
        items: [
          {
            id: "bv-1",
            title: "Video",
            noteUrl: "https://www.bilibili.com/video/BV1"
          }
        ]
      },
      "downloaded"
    )
    const runtime = {
      sendMessage: (
        _message: unknown,
        callback: (response: unknown) => void
      ) => {
        callback({
          ok: false,
          error: "Local API unavailable"
        })
      }
    }

    await expect(
      submitDeleteItemsRequestViaExtension("http://localhost:3001", request, {
        runtime
      })
    ).rejects.toThrow("Local API unavailable")
  })
})
