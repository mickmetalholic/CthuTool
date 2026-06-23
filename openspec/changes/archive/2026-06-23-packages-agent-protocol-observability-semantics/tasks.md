## 1. Protocol Schema

- [x] 1.1 Define optional observability metadata schema with bounded request, trace, parent, operation, and command correlation fields.
- [x] 1.2 Add metadata validation rules that reject unbounded strings, arbitrary objects, and sensitive artifact fields.
- [x] 1.3 Update protocol types and message factory signatures to support optional metadata without breaking callers.

## 2. Protocol Consumers

- [x] 2.1 Preserve metadata in browser command, result, error, and state-related message parsing where applicable.
- [x] 2.2 Update backend command gateway protocol usage to attach request context metadata when available.
- [x] 2.3 Update desktop browser host protocol usage to consume and return compatible metadata.
- [x] 2.4 Update CLI-facing protocol handling so correlation metadata stays out of JSON output unless explicitly requested.

## 3. Verification

- [x] 3.1 Add protocol parser and factory tests for messages with metadata.
- [x] 3.2 Add compatibility tests for messages without metadata.
- [x] 3.3 Add validation tests for malformed or unsafe metadata.
- [x] 3.4 Run agent-protocol typecheck and tests plus affected backend/desktop/CLI tests.
