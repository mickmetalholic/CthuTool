# Feature Specification: CLI script runner and script packages

**Feature Branch**: `007-cli-run-scripts`  
**Created**: 2026-04-13  
**Status**: Draft  
**Input**: User description: "在 cli 项目下新增一个「跑脚本」的命令，以及 scripts 的目录，scripts 目录下可以有多个独立可跑的脚本（每个脚本是一个文件夹，有 json 配置元信息文件和 index.ts 入口），也可以用跑脚本命令来选择然后运行。作为示例，先增加一个输出 helloworld 的独立脚本"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run the bundled demonstration script (Priority: P1)

A user installs or builds the CLI and wants to confirm that bundled scripts work by running the provided demonstration script that prints a hello-world style message.

**Why this priority**: Delivers a minimal end-to-end proof that script discovery, loading, and execution work.

**Independent Test**: Run the run-scripts flow with only the demonstration script present and observe the expected output without configuring anything beyond invoking the command.

**Acceptance Scenarios**:

1. **Given** the CLI is available and the demonstration script is present in the designated scripts area, **When** the user invokes the run-scripts command for that script, **Then** the process completes successfully and the user sees the hello-world output.
2. **Given** the demonstration script is present, **When** the user requests help or usage for the run-scripts capability, **Then** the user can understand how to invoke it without reading source code.

---

### User Story 2 - Choose among multiple scripts (Priority: P2)

A user has more than one bundled script available and wants to pick which one to run without manually editing project files.

**Why this priority**: Scales the feature beyond a single sample and matches the expected layout with multiple independent scripts.

**Independent Test**: Place at least two valid script packages in the scripts area, invoke the run-scripts command, select one option, and confirm only that script’s behavior runs.

**Acceptance Scenarios**:

1. **Given** two or more valid script packages exist, **When** the user invokes the run-scripts command without specifying a target in advance, **Then** the user can choose which script to run and the correct script executes.
2. **Given** multiple script packages exist, **When** the user specifies which script to run (if the command supports direct selection), **Then** that script runs without showing an unnecessary chooser.

---

### User Story 3 - Understand script layout for contributors (Priority: P3)

A contributor adds a new bundled script by following a repeatable folder layout so that it appears alongside existing scripts.

**Why this priority**: Keeps scripts maintainable and consistent as their number grows.

**Independent Test**: Add a new script package using only the documented layout; it appears in the run-scripts flow alongside others.

**Acceptance Scenarios**:

1. **Given** the documented layout for a script package (folder, metadata, entry), **When** a contributor adds a new package under the scripts area, **Then** the new script is discoverable by the run-scripts command assuming metadata and entry are valid.

---

### Edge Cases

- What happens when the scripts area is empty or contains no valid script packages?
- How does the CLI respond when a script package is missing required metadata or has unreadable metadata?
- What happens when a script’s entry runs but exits with a failure or produces an error result?
- What happens when two script packages use the same display name or identifier (if identifiers are shown to the user)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The CLI MUST expose a dedicated command whose purpose is to discover and execute bundled scripts shipped with the CLI package.
- **FR-002**: The CLI MUST maintain a designated scripts location that can hold zero or more independent script packages.
- **FR-003**: Each script package MUST live in its own folder and MUST include machine-readable metadata and a single entry point used for execution.
- **FR-004**: When more than one valid script package is available, the user MUST be able to select which script to run through the run-scripts command without manually copying files outside the intended flow.
- **FR-005**: The initial release MUST include at least one demonstration script package that prints a clear hello-world style message when run successfully.
- **FR-006**: When discovery or validation fails (for example missing metadata or invalid package), the CLI MUST report the problem in a way a user can act on (for example fix the package or reinstall), without a silent failure.

### Key Entities

- **Script package**: One folder representing a single runnable script, containing metadata describing the script and an entry used for execution.
- **Script metadata**: Structured information describing the script (for example title, description, and stable identifier for selection), used for listing and choosing scripts.

## Assumptions

- Script packages follow a single agreed layout: one folder per script, one metadata file, and one entry file at a defined path within that folder (exact filenames are fixed by project convention during implementation).
- The demonstration script exists to validate the pipeline; additional scripts are optional but must follow the same layout rules.
- Selection UX when multiple scripts exist may combine non-interactive arguments (if provided) with an interactive chooser when needed; exact flags are defined during planning.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user familiar with CLI help can run the demonstration script successfully on first attempt at least 90% of the time in usability testing (or equivalent structured trial).
- **SC-002**: With two valid script packages present, users can complete selection and execution of a chosen script in under 2 minutes from opening the terminal, excluding network or install issues.
- **SC-003**: In automated or manual checks, invalid script packages produce a clear, non-crashing error in 100% of covered failure cases defined in test plans.
- **SC-004**: Contributors can add a new script package using only the documented layout and see it listed without changing unrelated CLI commands.

## Constitution alignment *(implementation)*

When this specification names libraries, APIs, or stack choices, they MUST match
`.specify/memory/constitution.md` (functional modularity, `neverthrow` for business errors, `valibot` for
validation, TDD and TSDoc rules, monorepo naming, REST + `fetch`, and CI gates). Keep user-facing requirements
technology-agnostic unless the feature explicitly depends on a named technology.
