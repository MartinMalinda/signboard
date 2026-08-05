---
name: signboard-board-management
description: Manage Signboard boards stored as folders of Markdown cards, including discovery, V2 project profiles and metadata, card/frontmatter edits, labels, list/card ordering, archives, dates, and safe CLI/MCP or direct-filesystem workflows. Use when working in a project that contains a Signboard board or when an agent needs to inspect or update Signboard Markdown efficiently.
---

# Signboard Board Management

Use this skill when a Signboard board is stored in or alongside the current project. Treat the board as a file-backed data model: lists are directories, cards are Markdown files, and JSON manifests carry ordering and board settings.

## First identify the board

1. Prefer an explicitly supplied absolute board path.
2. Otherwise search only the relevant project area for directories containing list-like subdirectories and/or a root `.board.json`. Do not assume the project root is the board root.
3. Confirm the candidate by inspecting its immediate children. A normal board has list directories such as `To-do`, `Doing`, `Done`, or legacy names such as `000-To-do-stock`, plus `XXX-Archive` when archive support is in use.
4. If the Signboard CLI is installed, prefer machine-readable discovery:

   ```bash
   signboard boards list --json
   signboard --board "/absolute/path/to/Board" lists --json
   ```

   If Signboard MCP is available, use its board discovery/read tools first and follow the separate `signboard-mcp` skill when present.

Do not invent a board path from a name when multiple matches are possible. Report the selected absolute path in the result.

## Board filesystem model

The important shape is:

```text
Board/
  .board.json                 # root list order + settings, including optional settings.v2
  To-do/
    .board.json               # order of card filenames in this list
    Plan-release-ab123.md     # card Markdown
  Doing/
  Done/
  XXX-Archive/                # Signboard archive root; normally excluded from active views
    .signboard-archive.json   # metadata for archived lists, when applicable
```

Important details:

- New list directories use a sanitized readable name. Older boards may use numeric prefixes or suffixes; those names remain valid and must not be “normalized” just because they look old.
- The root `.board.json` has an `order` array of list directory names and a `settings` object. A list directory’s `.board.json` has an `order` array of card filenames.
- `order` is authoritative when present. Entries missing from a manifest are appended in a natural filename sort by Signboard. Do not use filename prefixes as a substitute for the manifest.
- Reordering a list or card should update the relevant manifest and keep directory/card filenames stable. Renaming or moving a card is not a reorder operation.
- Legacy order files `.list.json` and `.signboard-order.json` may be readable. New writes should use `.board.json`; when migrating, preserve the existing order and remove obsolete manifests only after the canonical file is safely written.
- Legacy board settings may exist in `board-settings.md` or `labels.md`. Signboard can read and migrate them, but current settings belong in the root `.board.json` under `settings`.

## Labels: where they live and how cards refer to them

Board label definitions live here:

```json
{
  "version": 1,
  "order": ["To-do", "Doing", "Done"],
  "settings": {
    "labels": [
      {
        "id": "launch",
        "name": "Launch",
        "colorLight": "#fb923c",
        "colorDark": "#f97316"
      }
    ]
  }
}
```

Cards store label IDs, not display names:

```yaml
labels:
  - launch
```

When adding or changing a label:

- Read the current `settings.labels` array first.
- Match existing labels by `id` (or carefully resolve a unique name); preserve IDs when only renaming or recoloring.
- Use a unique, stable, filesystem-safe ID for a new label. Do not silently create a second label with the same ID.
- Preserve both `colorLight` and `colorDark` when present. Normalize colors to six-digit hex values when creating new definitions.
- Add only the new label ID to a card unless the user explicitly asked to replace or clear labels.
- Preserve all unrelated root-manifest keys and all unrelated label objects.

Do not put a label’s human name into a card’s `labels` array unless the board already demonstrably uses names as IDs. The app and CLI resolve names for convenience, but the stored relationship is ID-based.

## Card Markdown format

Current cards use YAML frontmatter followed by the Markdown body:

```markdown
---
title: Plan release notes
start: 2026-04-02
due: 2026-04-05
labels:
  - launch
createdAt: 2026-03-20T12:00:00.000Z
signboard_id: ab123
---
Outline the next release notes draft.

- [ ] (start: 2026-04-02) Review screenshots
- [ ] (due: 2026-04-05) Publish announcement
```

Use these conventions:

- `title` is the card title. A filename is only an identity/container hint; changing the title does not require renaming the file.
- `start` and `due` are optional card-level dates in `YYYY-MM-DD` format. Use `start` for scheduled/start date and `due` for deadline. Remove the key, or use the CLI’s `none`, to clear it.
- `labels` is a de-duplicated array of label IDs.
- `signboard_id`, `createdAt`, `activity`, `archive`, `related`, `linked_objects`, and flat Obsidian properties may be present. Preserve them unless the requested operation specifically changes them.
- Unknown/custom frontmatter keys are valid. Do not rebuild frontmatter from a small allowlist and accidentally discard project-specific metadata.
- Legacy frontmatter formats and alternate keys may still be readable. If editing an existing card, preserve its meaning and prefer Signboard’s parser/CLI for normalization.
- Checklist date markers are task-level metadata, not card frontmatter. Recognized prefixes include `(start: YYYY-MM-DD)`, `(scheduled: YYYY-MM-DD)`, and `(due: YYYY-MM-DD)`.
- Completed task date markers and cards in completed workflow lists are normally non-actionable. Do not infer active work solely from the presence of a date.

## V2 project boards and cards

Check the root `.board.json` before applying V2 semantics. A V2-enabled board has a `settings.v2` profile with `enabled: true`; newly created boards use the `default-product` profile by default, while older boards may be legacy-only. Do not add V2 metadata to a legacy card merely because a field name appears in arbitrary frontmatter.

V2 card metadata is additive and namespaced under `signboard_v2`:

```yaml
signboard_v2:
  contract_version: 1
  kind: task                 # task, discovery, epic, or incident
  work_type: product         # profile-supported work category
  priority_class: P2        # P0, P1, P2, or P3
  estimate:
    effort_points: 3
  depends_on: []             # related card titles
  blocked_by: []             # related card titles
  objective: ""
  scope: ""
  acceptance_criteria: []
  verification: ""
  parent: null
  status_summary: ""
  next_action: ""
```

The scoring/evaluator surface may also contain optional `opportunity`, `risk_prevented`, `delivery`, `modifiers`, and `execution` groups. Preserve these and any unknown V2 keys when editing. V2 relations currently use card titles as strings; preserve the existing spelling and do not silently convert them to IDs.

V2 stage/status remains list-derived. Move a card between list directories with the normal move operation; do not invent or overwrite a separate status field in `signboard_v2`. When editing an existing card, preserve both legacy frontmatter and its `signboard_v2` namespace unless the requested migration explicitly changes them. V2 fields remain optional, and incomplete or legacy cards must stay readable.

For the complete V2 operating model—card shaping, scoring, priority gates, delivery risk, QA, autonomy classes, specialized views, agent selection, and governance—read [references/v2-framework.md](references/v2-framework.md) before ranking or claiming work.

## Choose the safest mutation path

Use this order of preference:

1. Signboard MCP tools, if connected and allowed. Read configuration/board state first, honor read-only mode and allowed roots, then use the purpose-built card/list/settings/archive operation.
2. Signboard CLI, if installed. Use `--json` for reads and `--dry-run --json` before consequential writes.
3. Direct Markdown/JSON edits only when the CLI/MCP is unavailable or the requested operation is not exposed.

For V2 writes, prefer the V2-aware create/settings arguments exposed by the CLI or MCP. If a V2 metadata patch is not exposed by the selected tool, use the desktop editor or an atomic Markdown edit rather than putting V2 keys into an unrelated legacy field.

Useful CLI patterns:

```bash
signboard boards list --json
signboard --board "/absolute/path/to/Board" lists --json
signboard --board "/absolute/path/to/Board" cards --json
signboard --board "/absolute/path/to/Board" cards read --card ab123
signboard --board "/absolute/path/to/Board" cards edit --card ab123 --add-label launch --dry-run --json
signboard --board "/absolute/path/to/Board" cards edit --card ab123 --move-to Doing
signboard --board "/absolute/path/to/Board" cards duplicate --card ab123 --list Doing --dry-run --json
```

Use exact list/card references where possible. CLI references can resolve a directory name, display name, filename, card ID, title, or unique partial match; read first if a reference might be ambiguous.

## Direct filesystem editing rules

Before writing:

- Read the current card, the relevant list manifest, and the root manifest if labels/settings/order are involved.
- Check whether the Signboard desktop app or another process may be editing the same board. Avoid racing an open card editor; an editor with unsaved local changes can overwrite an external change.
- Make the smallest possible change and preserve unknown JSON/frontmatter fields.

When writing:

- Write through a same-directory temporary file and atomic rename where possible. Never truncate a live card or manifest in place.
- For root `.board.json`, merge into the existing object. Never replace the whole file with a list-only object: that would delete `settings.labels` and other board settings.
- For list `.board.json`, merge existing manifest metadata and change only `order`.
- If adding a card directly, choose a collision-safe filename, write valid frontmatter/body, then add that exact filename to the target list manifest at the requested position.
- If moving a card between lists, move the file and update both source and target manifests transactionally. Preserve its filename and frontmatter.
- If reordering, update only the `order` array. Do not rename every card/list to manufacture order prefixes.
- Validate JSON and YAML after writing, then re-read the affected card/list/board to verify the resulting order and metadata.

## Archive behavior

`XXX-Archive` is a special archive root, normally hidden from active list/card views. Archiving is a move, not deletion:

- Archived cards may receive an `archive` frontmatter object containing original-list and archive timestamps/state.
- Archived lists carry `.signboard-archive.json` metadata so they can be restored with their history.
- Archive filenames can receive a generated prefix to avoid collisions. Do not treat that prefix as a new card identity.
- Use Signboard archive/list/restore commands or MCP tools when possible. Do not manually delete archive metadata or move archived content back without clearing archive state and updating manifests.
- Include archive content in reporting only when the user asks for it or explicitly requests historical/archived work.

## Efficient inspection and reporting

For a board summary, read in this order: root `order`, each ordered list name, each list’s ordered card filenames, then only the frontmatter/body needed for the user’s filter. Avoid loading every full Markdown body when titles, labels, dates, or counts answer the question.

For updates, report:

- the absolute board path;
- the list/card selected, using both display name and actual directory/filename when useful;
- the exact metadata/body/order changes;
- whether archive state or labels were involved; and
- any ambiguity, legacy format, missing manifest entry, or validation issue encountered.

If the requested change is only a content edit, do not “clean up” filenames, list prefixes, labels, or manifests as unrelated work.
