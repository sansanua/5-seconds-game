# Issue Tracking

**NIMPORTANT**: When starting check if project uses [bd (beads)](https://github.com/steveyegge/beads) for issue tracking. Use `bd` commands instead of markdown TODOs. Otherwise ask to setup it with `bd init --stealth`.

Then Run the interactive guide to learn the full workflow:
`bd quickstart`

### Quick reference for agent workflows:

# Find ready work
`bd ready --json | jq '.[0]'`

# Create issues during work
`bd create "Discovered bug" -t bug -p 0 --json`

**IMPORTANT**: Use the dedicated `--acceptance` field for acceptance criteria instead of putting them in the description:
`bd create "Feature title" -d "Description" --acceptance "- Criteria 1\n- Criteria 2" --json`
or update existing:
`bd update <issue-id> --acceptance "- Updated criteria" --json`

# Link discovered work back to parent
`bd dep add <new-id> <parent-id> --type discovered-from`

# Update status
`bd update <issue-id> --status in_progress --json`

# Complete work
`bd close <issue-id> --reason "Implemented" --json`

# Document work with notes (NOT comments)
**IMPORTANT**: BD web UI does not display comments. Always use `--notes` field to document work:
`bd update <issue-id> --notes "Work summary here" --json`

Notes field supports Markdown formatting for better readability in the web UI.

### Using bv as an AI sidecar

**IMPORTANT**: bv is a fast terminal UI for Beads projects (.beads/beads.jsonl). It renders lists/details and precomputes dependency metrics (PageRank, critical path, cycles, etc.) so you instantly see blockers and execution order. For agents, it's a graph sidecar: instead of parsing JSONL or risking hallucinated traversal, call the robot flags to get deterministic, dependency-aware outputs.

*IMPORTANT: As an agent, you must ONLY use bv with the robot flags, otherwise you'll get stuck in the interactive TUI that's intended for human usage only!*

- bv --robot-help — shows all AI-facing commands.
- bv --robot-insights — JSON graph metrics (PageRank, betweenness, HITS, critical path, cycles) with top-N summaries for quick triage.
- bv --robot-plan — JSON execution plan: parallel tracks, items per track, and unblocks lists showing what each item frees up.
- bv --robot-priority — JSON priority recommendations with reasoning and confidence.
- bv --robot-recipes — list recipes (default, actionable, blocked, etc.); apply via bv --recipe <name> to pre-filter/sort before other flags.
- bv --robot-diff --diff-since <commit|date> — JSON diff of issue changes, new/closed items, and cycles introduced/resolved.

Use these commands instead of hand-rolling graph logic; bv already computes the hard parts so agents can act safely and quickly.

### Dependencies

Use `bd` to proactively create issues for discovered bugs, TODOs, and follow-up tasks. Close completed issues and update status for in-progress work. Decompose large tickets (epics) into smaller and connect via dependencies. Use depedencies to create links between
any tickets. Use decomposition for multi-level depedendencies between tickets.

# Add dependency (bd-f14c depends on bd-a1b2)
```
bd dep add bd-f14c bd-a1b2
bd dep add bd-3e7a bd-a1b2 --type blocks
```

# Remove dependency
`bd dep remove bd-f14c bd-a1b2`

# Show dependency tree
`bd dep tree bd-f14c`

# Detect cycles
`bd dep cycles`

Dependency Types
**blocks**: Hard blocker (default) - issue cannot start until blocker is resolved
**related**: Soft relationship - issues are connected but not blocking
**parent-child**: Hierarchical relationship (child depends on parent)
**discovered-from**: Issue discovered during work on another issue (automatically inherits parent's source_repo)

### Dependency Modeling (CRITICAL)

**The graph algorithm only knows what you encode.** If you don't model a dependency, it doesn't exist for the algorithm.

**RULES for proper dependency modeling:**

1. **Encode ALL ordering constraints as blocking dependencies**
    - If task A MUST complete before task B, add: `bd dep add B A --type blocks`
    - Don't rely on priority (P1/P2) or phase numbers for ordering
    - Don't assume humans will "just know" the right order

2. **Foundation tasks must block dependent work**
    - Convention-setting tasks → block tasks that follow that convention
    - Setup/infrastructure tasks → block tasks that use that infrastructure
    - If skipping a task would cause problems later, it should be a blocker

3. **Model parallel work explicitly**
    - Tasks that CAN run in parallel should NOT have blocking deps between them
    - Only add blocking deps where true sequential ordering is required
    - Independent work streams should be visible as separate branches in the graph

4. **Verify with `bv --robot-plan`**
    - After creating deps, check that parallel tracks appear correctly
    - The "highest_impact" task should make sense
    - If the algorithm recommends wrong task, your model is incomplete

5. **Serialize shared file modifications (CRITICAL for multi-agent)**
    - "Parallel tracks" in a graph DON'T mean "safe to parallelize" if tracks modify the same files
    - Tasks that extract/modify the SAME SOURCE FILE must be serialized
    - Example: If 3 tasks all extract from `Contracts.cs`, chain them: `task1 → task2 → task3`
    - This prevents merge conflicts when multiple agents work on "parallel" tracks
    - After modeling logical deps, audit: "Which tasks touch the same files?" → add serialization deps

**Anti-patterns to avoid:**
- ❌ Flat list of tasks under epic with no inter-task deps
- ❌ Using priority to imply order instead of blocking deps
- ❌ Phase numbers in descriptions instead of graph structure
- ❌ Assuming "obvious" ordering without encoding it
- ❌ Parallel tracks that modify the same file (causes merge conflicts with multiple agents)
