## Context

Backend and desktop communicate through typed agent protocol messages. Existing command ids provide one correlation point, but they do not carry upstream request context, trace context, or operation metadata across the protocol boundary.

## Goals / Non-Goals

**Goals:**
- Define optional protocol metadata for request, trace, parent, operation, and command correlation.
- Preserve compatibility with peers that omit metadata.
- Keep metadata bounded and free of sensitive artifacts.

**Non-Goals:**
- Mandating a specific tracing vendor or exporter.
- Changing browser command permissions or payload semantics.
- Requiring a breaking protocol version unless compatibility proves impossible.

## Decisions

1. Add optional metadata rather than changing existing message identity fields.
   - Rationale: Command id and agent id remain stable while richer correlation is additive.
   - Alternative considered: replace command id with trace id. That would blur command correlation and distributed tracing concerns.

2. Validate metadata with tight schemas.
   - Rationale: Protocol metadata should carry identifiers and operation labels, not arbitrary diagnostic payloads.
   - Alternative considered: allow a free-form metadata object. That risks sensitive data and schema drift.

3. Preserve metadata in both results and errors.
   - Rationale: Failures need correlation as much as successful commands.
   - Alternative considered: only attach metadata to commands. Backend errors would then lose context.

## Risks / Trade-offs

- Protocol metadata may duplicate command id -> keep command id as required command identity and metadata as optional context.
- Older peers will omit metadata -> downstream code must tolerate missing fields.
- Overly strict validation can reject useful future fields -> reserve explicit extension points only after a design review.

## Migration Plan

1. Add protocol metadata schemas and types as optional fields.
2. Update message factories and parsers to preserve metadata.
3. Update backend and desktop consumers to attach and propagate metadata.
4. Add compatibility tests for messages with and without metadata.

## Open Questions

- Should the metadata shape use W3C `traceparent` directly or separate `traceId` and `parentId` fields?
- Which operation names should be standardized in protocol versus app-level changes?
- Should metadata be included in browser state snapshots or only command/response messages initially?
