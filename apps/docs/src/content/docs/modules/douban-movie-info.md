---
title: Douban Movie Info
description: Douban movie information capability and ownership boundaries.
---

Douban movie information work is backend-owned or service-owned. The local
Agent stays focused on local browser execution and user-visible login state.

## Runtime Location

- Backend: searching, parsing, caching, and service capability ownership
- Agent: local browser execution when authenticated browser access is required

## Boundaries

The Agent does not parse Douban movie data itself. It can host login and browser
execution required by backend-directed work. The former Desktop-only Douban
lookup UI has no deployed-Web replacement and is intentionally removed from the
client surface; backend APIs remain.

## Authoritative Sources

- Backend requirements: `openspec/specs/apps-backend-douban-movie-info/spec.md`
- Legacy removed requirement: `openspec/specs/apps-desktop-douban-movie-info/spec.md`
- Agent/browser requirements are introduced by the ordered local-Agent changes.
