---
title: Add an optional V2 board profile to .board.json
labels:
  - data-model
  - migration
  - testing
createdAt: 2026-08-03T12:54:57.139Z
activity:
  - type: created
    at: 2026-08-03T12:54:57.139Z
area: board-settings
blocks:
  - Extend the batched board snapshot with an opt-in V2 card projection
depends_on:
  - 'Decide V2 card contract: hardcoded attributes versus generic fields'
  - Define per-board project profile and dashboard contract
  - Choose migration and compatibility strategy for existing boards and cards
enablement:
  downstream_value: 5
  downstream_breadth: 5
  critical_path: 5
engineering_health:
  maintenance_reduction: 3
  complexity_reduction: 2
  reliability_testability: 4
  recurring_time_saved: 3
estimate:
  effort_points: 3
  implementation_complexity: 2
  coordination_complexity: 2
evidence:
  - lib/boardLabels.js
  - lib/atomicFile.js
  - lib/orderManifest.js
  - scripts/test-board-labels.js
execution:
  specification_clarity: 4
  verification_strength: 4
  boundedness: 4
  isolation: 4
  coordination_complexity: 2
framework_status: done
framework_version: 1
kind: task
modifiers:
  confidence: 3
  strategic_fit: 5
  urgency: 3
  maintenance_delta: 0
next_action: Downstream snapshot and settings consumers may rely on the normalized opt-in profile seam.
priority_class: P2
status_summary: Profile seam verified across desktop/shared settings, MCP, CLI, snapshots, legacy migration, and build tests; absent profile still means current behavior.
work_type: engineering_health
signboard_v2:
  contract_version: 1
  kind: task
  priority_class: P2
  depends_on:
    - 'Decide V2 card contract: hardcoded attributes versus generic fields'
    - Define per-board project profile and dashboard contract
    - Choose migration and compatibility strategy for existing boards and cards
  blocked_by: []
  estimate:
    effort_points: 3
  opportunity:
    reach: 3
    benefit: 4
    frequency: 2
  discovery_value:
    uncertainty_reduction: 4
    decision_importance: 4
    cost_of_wrong_choice: 3
  modifiers:
    confidence: 3
    urgency: 3
    maintenance_delta: 0
  delivery:
    regression_likelihood: 2
    change_blast_radius: 3
    reversibility: 3
---
# Scope

Add optional V2 profile enablement, normalized profile data, section identifiers, stage/list mappings, and preservation of unknown manifest keys.

Do not add dashboard rendering, automatic card migration, or new list folder conventions in this card.

# Accepted profile contract

Persist the normalized profile under `.board.json` at `settings.v2`:

- `enabled`, `profileId`, `version`, `title`, and `description`.
- `stages` with `inbox`, `shaping`, `ready`, `active`, `review`, `blocked`, `done`, and `dropped` list-name arrays.
- `dashboard.sections`, `dashboard.title`, and `dashboard.description`.
- `cardDefaults.kind`, `cardDefaults.workType`, and `cardDefaults.priorityClass`.
- `retainPlanner`.

Defaults are disabled/empty profile metadata, the four stable sections `critical`, `next_best_work`, `low_hanging_fruit`, and `blocked`, card defaults `task`/`P2`, and `retainPlanner: true`. Only `enabled: true` activates V2. Unknown manifest keys remain intact; invalid or missing profile data fails closed without card writes or backfill.

# Acceptance criteria

- [x] Boards without a profile behave exactly as before.
- [x] Profile writes use the existing atomic settings path.
- [x] Partial profiles get conservative defaults.
- [x] Legacy board-settings.md migration is unchanged.
- [x] Normalization is shared by desktop, CLI, MCP, and agent-facing settings paths.

# Objective

Provide the smallest persisted, opt-in V2 board profile so downstream snapshot and UI work has one normalized configuration seam without changing ordinary boards.

# Verification

- Unit-test absent, partial, valid, and invalid profiles plus unknown `.board.json` keys.
- Confirm writes use the existing atomic path and disabled boards produce the current snapshot/settings behavior.
- Rollback: remove or disable `settings.v2`; no card or list data is rewritten.

# Implementation evidence

- `lib/boardLabels.js` normalizes and atomically persists the optional profile while preserving unrelated manifest and nested profile keys.
- `lib/mcpServer.js` exposes V2 settings through the read/update board-settings tools.
- `signboard-vue/src/types.ts` documents the shared profile shape for downstream consumers.
- Focused tests pass: `npm run test:board-labels`, `npm run test:board-snapshot`, `npm run test:board-duplication`, `npm run test:app-settings`, `npm run test:mcp`, `npm run test:cli`, `npm run test:desktop-cli`, and `npm run build:vue`.
- MCP smoke coverage runs header, BOM-header, and NDJSON transports; import fixture assertions use the current plain list-folder naming convention.
