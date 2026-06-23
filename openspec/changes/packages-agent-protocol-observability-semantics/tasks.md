## 1. Protocol Schema

- [ ] 1.1 Define optional observability metadata schema with bounded request, trace, parent, operation, and command correlation fields.
- [ ] 1.2 Add metadata validation rules that reject unbounded strings, arbitrary objects, and sensitive artifact fields.
- [ ] 1.3 Update protocol types and message factory signatures to support optional metadata without breaking callers.

## 2. Protocol Consumers

- [ ] 2.1 Preserve metadata in browser command, result, error, and state-related message parsing where applicable.
- [ ] 2.2 Update backend command gateway protocol usage to attach request context metadata when available.
- [ ] 2.3 Update desktop browser host protocol usage to consume and return compatible metadata.
- [ ] 2.4 Update CLI-facing protocol handling so correlation metadata stays out of JSON output unless explicitly requested.

## 3. Verification

- [ ] 3.1 Add protocol parser and factory tests for messages with metadata.
- [ ] 3.2 Add compatibility tests for messages without metadata.
- [ ] 3.3 Add validation tests for malformed or unsafe metadata.
- [ ] 3.4 Run agent-protocol typecheck and tests plus affected backend/desktop/CLI tests.
