import type {
  CollectionDraft,
  ItemDraft,
} from "@collection-hub/libs"

export type CollectionExtractionDraft = {
  source: string
  collection: CollectionDraft
  items: ItemDraft[]
}

export type QueryableElement = {
  textContent: string | null
  getAttribute(name: string): string | null
  querySelector(selector: string): QueryableElement | null
  querySelectorAll(selector: string): Iterable<QueryableElement> | ArrayLike<QueryableElement>
}

export type QueryableDocument = {
  title?: string
  location?: { href: string }
  querySelector(selector: string): QueryableElement | null
  querySelectorAll(selector: string): Iterable<QueryableElement> | ArrayLike<QueryableElement>
}

export type DomCollectionAdapter = {
  id: string
  canHandle(document: QueryableDocument): boolean
  extract(document: QueryableDocument): CollectionExtractionDraft
}
