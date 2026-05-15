import type { DomCollectionAdapter, QueryableDocument, QueryableElement } from "./dom-adapter"

export const sampleDomAdapter: DomCollectionAdapter = {
  id: "sample-dom-adapter",

  canHandle(document) {
    return Boolean(
      document.querySelector("[data-xhs-collection]") &&
        Array.from(document.querySelectorAll("[data-xhs-item]")).length > 0
    )
  },

  extract(document) {
    const collectionElement = requireElement(
      document.querySelector("[data-xhs-collection]"),
      "Missing [data-xhs-collection] container"
    )
    const sourceUrl = readAttribute(collectionElement, "data-source-url") ?? document.location?.href ?? ""
    const title =
      readAttribute(collectionElement, "data-title") ??
      readText(collectionElement.querySelector("[data-xhs-collection-title]")) ??
      document.title ??
      "Untitled collection"

    return {
      source: this.id,
      collection: {
        id: readAttribute(collectionElement, "data-id"),
        sourceUrl,
        title,
        description: readAttribute(collectionElement, "data-description"),
        coverUrl: readAttribute(collectionElement, "data-cover-url")
      },
      items: Array.from(document.querySelectorAll("[data-xhs-item]")).map((item, index) =>
        extractItem(item, sourceUrl, index)
      )
    }
  }
}

function extractItem(element: QueryableElement, sourceUrl: string, index: number) {
  const authorElement = element.querySelector("[data-xhs-author]")
  const noteUrl = readAttribute(element, "data-note-url") ?? `${sourceUrl}#item-${index + 1}`
  const title =
    readAttribute(element, "data-title") ??
    readText(element.querySelector("[data-xhs-title]")) ??
    readText(element) ??
    `Untitled item ${index + 1}`
  const authorName =
    readAttribute(element, "data-author-name") ??
    readAttribute(authorElement, "data-name") ??
    readText(authorElement)

  return {
    id: readAttribute(element, "data-id"),
    title,
    noteUrl,
    coverUrl: readAttribute(element, "data-cover-url"),
    author: authorName
      ? {
          id: readAttribute(element, "data-author-id") ?? readAttribute(authorElement, "data-id"),
          name: authorName,
          avatarUrl:
            readAttribute(element, "data-author-avatar-url") ??
            readAttribute(authorElement, "data-avatar-url"),
          profileUrl:
            readAttribute(element, "data-author-profile-url") ??
            readAttribute(authorElement, "data-profile-url")
        }
      : undefined
  }
}

function requireElement<T>(element: T | null, message: string): T {
  if (!element) {
    throw new Error(message)
  }
  return element
}

function readAttribute(element: QueryableElement | null, name: string): string | undefined {
  const value = element?.getAttribute(name)?.trim()
  return value ? value : undefined
}

function readText(element: QueryableElement | null): string | undefined {
  const value = element?.textContent?.trim()
  return value ? value : undefined
}
