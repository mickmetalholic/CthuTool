---
title: Douban Movie Info
description: Douban movie information capability and ownership boundaries.
---

Douban movie information work is backend-owned or service-owned. CthuDesktop stays focused on local browser execution and user-visible login state.

## Runtime Location

- Backend: searching, parsing, caching, and service capability ownership
- Desktop: local browser execution when authenticated browser access is required

## Boundaries

CthuDesktop does not parse Douban movie data itself. It can host login and browser execution required by backend-directed work.

## Authoritative Sources

- Backend requirements: `openspec/specs/apps-backend-douban-movie-info/spec.md`
- Desktop requirements: `openspec/specs/apps-desktop-douban-movie-info/spec.md`
- Browser host requirements: `openspec/specs/apps-desktop-browser-host/spec.md`
