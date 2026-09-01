## Purpose

Define an extensible, portable presentation surface that makes CthuCodex English corrections prominent while preserving complete feedback on hosts that do not render MCP Apps components.

## ADDED Requirements

### Requirement: Plugin-bundled language-feedback presentation surface
CthuCodex SHALL expose a dedicated language-feedback MCP server with a read-only presentation tool and a versioned MCP Apps UI resource, independently from the existing Anki MCP server.

#### Scenario: Installed plugin exposes the presentation server
- **WHEN** CthuCodex is installed from `codex/plugins/cthu-codex`
- **THEN** its MCP configuration declares a language-feedback presentation server
- **AND** the existing Anki MCP server declaration remains unchanged

#### Scenario: Presentation tool advertises its UI resource
- **WHEN** a client lists tools from the language-feedback server
- **THEN** the server exposes `cthu_language_feedback_present`
- **AND** the tool metadata associates it with `ui://cthu-language-feedback/v1.html` through the standard MCP Apps UI resource field

#### Scenario: Client reads the presentation resource
- **WHEN** a compatible client reads `ui://cthu-language-feedback/v1.html`
- **THEN** the server returns a self-contained resource with the MCP Apps UI media type
- **AND** the resource can render without loading scripts, styles, images, or data from an external origin

### Requirement: Versioned language-feedback payload
The presentation tool SHALL accept and return a versioned structured payload containing the original prose, the best natural rewrite, categorized coaching notes, and an optional presentation variant.

#### Scenario: Valid compact feedback is accepted
- **WHEN** the tool receives version `1`, non-empty `original` and `bestVersion` strings within the documented bounds, zero or more valid notes, and variant `compact` or no variant
- **THEN** it returns the normalized payload as structured content
- **AND** omitted variant is normalized to `compact`

#### Scenario: Notes use stable categories
- **WHEN** the payload includes coaching notes
- **THEN** each note contains a non-empty message and one category from `grammar`, `naturalness`, `tone`, `idiom`, `clarity`, or `other`
- **AND** the tool preserves note order

#### Scenario: Invalid feedback is rejected before presentation
- **WHEN** the payload has an unsupported version or variant, a missing required string, an unsupported note category, more than 12 notes, an `original` or `bestVersion` value longer than 8,000 characters, or a note message longer than 2,000 characters
- **THEN** the tool returns a structured validation error
- **AND** it does not return the payload as successful structured content

### Requirement: Prominent compact feedback card
On compatible hosts, the version `1` compact component SHALL present the best natural rewrite as the dominant content while keeping the original prose and coaching notes available in a clear visual hierarchy.

#### Scenario: Compact feedback renders
- **WHEN** the component receives a valid compact language-feedback result
- **THEN** it displays an identifiable language-coach heading
- **AND** it gives `bestVersion` stronger visual emphasis than `original`
- **AND** it renders each note with its category and message

#### Scenario: Feedback has no explanatory notes
- **WHEN** the component receives valid feedback with an empty notes array
- **THEN** it still displays the heading, original prose, and best natural rewrite without an empty notes section

#### Scenario: User copies the best version
- **WHEN** the user activates the component's copy control
- **THEN** the component attempts to copy only `bestVersion`
- **AND** it exposes an accessible success or failure status without calling another tool

### Requirement: Host-adaptive and accessible presentation
The component SHALL remain usable across supported light and dark host themes, narrow inline layouts, keyboard navigation, and assistive technology.

#### Scenario: Host theme changes
- **WHEN** the host or operating system changes between light and dark appearance
- **THEN** the component updates its colors without losing readable contrast or content hierarchy

#### Scenario: Component is keyboard operated
- **WHEN** a user navigates the card without a pointing device
- **THEN** every interactive control is reachable and has a visible focus state
- **AND** feedback sections retain meaningful labels for assistive technology

#### Scenario: Host-specific UI extensions are absent
- **WHEN** the component runs in a compatible MCP Apps host without ChatGPT-specific UI extensions
- **THEN** its core feedback rendering and copy behavior remain usable
- **AND** it does not fail because an optional host extension is missing

### Requirement: Complete portable fallback
Every successful presentation-tool result SHALL include complete human-readable fallback content in addition to the structured component payload.

#### Scenario: Host does not render the component
- **WHEN** a client invokes the presentation tool but does not render its MCP Apps resource
- **THEN** the standard tool content still identifies the language feedback
- **AND** it includes the best natural rewrite and every coaching note

#### Scenario: Presentation tool is unavailable
- **WHEN** language coaching is active but the presentation tool cannot be called
- **THEN** the coaching workflow can express the same best-version and notes content as prominent Markdown
- **AND** failure to present custom UI does not prevent completion of the user's requested task

### Requirement: Read-only local presentation
The language-feedback presentation surface SHALL NOT send feedback to external services, persist correction history or preferences, or mutate Anki or other user data.

#### Scenario: Feedback is presented
- **WHEN** the presentation tool or component handles a valid feedback payload
- **THEN** all processing remains within the local plugin and host UI boundary
- **AND** no external network request or persistent write is performed

#### Scenario: Copy control is used
- **WHEN** the user copies the best version
- **THEN** the component performs only the user-requested local clipboard interaction
- **AND** it does not record telemetry or invoke an MCP mutation tool
