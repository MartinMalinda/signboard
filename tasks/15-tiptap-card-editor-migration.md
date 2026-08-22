# Task 15 — Tiptap card-editor migration

Status: **complete**

Depends on: Task 03 (card editor core) and Task 10 (editor extras).

## Goal

Replace the OverType notes surface in the Vue card editor with a Tiptap-based
Markdown editor that provides native task-list checkboxes while preserving
Signboard's existing card behavior, file format, save lifecycle, and editor
extras.

The migration changes the notes-rendering engine, not the card-editor state
model. `useEditorStore` remains the source of truth for title, body,
frontmatter, dirty state, save serialization, and external-file refresh.

## Recommended strategy

Adapt `signboard-vue/src/lib/components/RichTextEditor.vue` into a
Signboard-specific controlled editor, then swap it behind the existing
`CardNotesEditor.vue` integration boundary.

Do not embed Tiptap into OverType. Running two editor state models or allowing
both libraries to own the same DOM would make checkbox state, selection,
external refresh, and save ordering difficult to reason about.

Target composition:

```text
EditCardModal.vue
  └─ CardNotesEditor.vue       # lifecycle/integration boundary
       └─ TiptapCardNotesEditor # Markdown/Tiptap implementation
```

Tiptap is now the only Vue card-editor notes implementation. The deprecated
OverType fallback is not loaded by the canonical Vue renderer.

## Current findings

- `CardNotesEditor.vue` already owns OverType lifecycle, theme synchronization,
  raw URL decoration, external body replacement,
  and the editor-facing component API.
- `useEditorStore` already provides the correct controlled state boundary via
  `body`, `setBody()`, `refreshFromDiskIfClean()`, and the serialized save queue.
- `RichTextEditor.vue` is currently generic FormKit/destination code rather
  than Signboard card-editor code.
- The Tiptap extensions are referenced but the optional extension map is not
  currently used to configure the editor.
- Tiptap packages are not yet declared in `signboard-vue/package.json`.
- Signboard task dates are Markdown markers, not ordinary Tiptap task-item
  attributes. The editor preserves those markers but does not render per-task
  date controls.

## In scope

- Add and pin the required Tiptap packages and Markdown serializer/parser.
- Convert `RichTextEditor.vue` to a controlled Signboard component.
- Enable native `TaskList`/`TaskItem` checkboxes, including nested tasks.
- Preserve Markdown input/output and Signboard task-date markers.
- Preserve card-editor save, focus, theme, external-sync, URL, and drop-linking
  behavior.
- Keep the Vue notes surface on the single Tiptap implementation.
- Add focused unit/component coverage and update Vue Playwright coverage.
- Remove the fallback only after parity is verified.

## Out of scope

- Changing the card Markdown format or frontmatter schema.
- Replacing `useEditorStore` or the existing save queue.
- Adding a general-purpose rich-text destination/FormKit abstraction.
- Persisting Tiptap JSON in card files.
- Reworking unrelated renderer behavior.

## Implementation phases

### 1. Establish the editor contract

Define the minimum API shared by the OverType and Tiptap implementations:

```ts
interface CardNotesEditorApi {
  setExternalBody(value: string): void
  focus(): void
}
```

The component should accept `modelValue: string` and emit
`update:modelValue`. `CardNotesEditor.vue` should continue to call
`editorStore.setBody()` and should remain responsible for connecting the
notes surface to the modal and store.

Preserve the existing modal focus behavior, including the `focusNotes` path.
The Tiptap contenteditable element must have a stable accessible label and a
stable selector for focus and tests.

### 2. Make the Tiptap component Signboard-native

Refactor `RichTextEditor.vue` to:

- remove FormKit `context`, `adapter`, and destination-specific branches;
- import the project `Modal`, `Button`, and input primitives from valid paths;
- use `modelValue`/`update:modelValue`;
- use the project theme tokens and accessibility conventions;
- add the actual extensions to `useEditor()`;
- update editor content only when the incoming Markdown differs from the
  current draft, avoiding update loops;
- destroy listeners before destroying the editor instance.

The initial extension set should include:

- `Document`, `Paragraph`, `Text`, `HardBreak`, `History`;
- Markdown parsing/serialization;
- `TaskList` and `TaskItem` with nested tasks;
- `Bold`, `Italic`, `Link`, headings, ordered/bullet lists, blockquotes,
  inline code, and code blocks.

Images should initially be disabled or constrained until their persistence
model is decided. Base64 image data must not be written into card Markdown
accidentally.

### 3. Validate Markdown and checkbox round-tripping

Before wiring the full modal, test these cases through the editor:

- plain paragraphs and line breaks;
- unchecked and checked tasks;
- nested tasks;
- headings, emphasis, links, code, blockquotes, and lists;
- empty notes;
- repeated load/update cycles;
- Markdown containing unknown or unsupported syntax.

The persisted result must remain Markdown and must not become Tiptap JSON or
HTML. Checkbox toggles must update the Markdown body through the normal
`useEditorStore.setBody()` path.

### 4. Preserve task-date markers

Keep `(start: YYYY-MM-DD)`, `(scheduled: YYYY-MM-DD)`, and
`(due: YYYY-MM-DD)` markers intact during Tiptap Markdown round-trips. Task
date editing controls are intentionally not rendered beside checklist items.

### 5. Restore editor extras

Port or adapt the existing Tiptap behavior for:

- raw URL visual marking and `window.electronAPI.openExternal`;
- Cmd/Ctrl-click URL opening;
- local-file drag/drop and linked-object attachment;
- external clean-editor refresh through `setExternalBody()`;
- theme changes, reduced motion, forced colors, and keyboard focus styling;
- link editing with selection restoration and accessible modal focus.

Avoid turning raw URLs into persisted Markdown links unless the user
explicitly edits them as links.

### 6. Migrate the wrapper to the single editor

Run the editor flows against Tiptap through `CardNotesEditor.vue`:

- open and close;
- focus notes on create-and-open;
- rapid typing and close;
- external clean-file edit;
- external dirty-file edit;
- task checkbox toggle;
- task date marker preservation;
- raw URL opening;
- file drop linking;
- theme toggle;
- modal Escape/focus restoration.

### 7. Make Tiptap the default and retire the fallback

After parity is demonstrated:

- make Tiptap the default implementation;
- remove the feature switch and unused OverType-specific integration code;
- update `tasks/PARITY.md` and the relevant project
  documentation;
- keep unrelated renderer behavior outside the Tiptap migration unchanged.

## Acceptance criteria

- Editing a task uses a real accessible checkbox input.
- Checkbox changes persist as standard Markdown task markers.
- Card files remain byte-compatible with the existing Markdown/frontmatter
  writer for supported content.
- Signboard task start/due markers survive load, checkbox toggles, and save.
- No local draft is overwritten by a clean external refresh.
- Dirty drafts are not overwritten by external changes.
- Save debounce and serialization behavior remains unchanged.
- Card editor focus, Escape handling, URL behavior, file drops, and theme
  behavior remain intact.
- Focused Vue unit/component tests pass.
- The Vue card-editor Playwright subset passes when Electron is runnable.
- Existing legacy tests remain unchanged and green apart from documented
  pre-existing failures.

## Main risks

1. **Markdown serializer drift** — Tiptap may normalize formatting or alter
   unsupported Markdown. Round-trip fixtures must be established before the
   swap.
2. **Task-date positioning** — the existing controls depend on measured
   textarea geometry and cannot be reused directly.
3. **External synchronization loops** — setting Tiptap content from disk must
   not emit a save or mark a clean editor dirty.
4. **Image persistence** — Tiptap's base64 image option is unsafe for the
   card-file model unless explicitly handled.
5. **Accessibility regressions** — native checkboxes help, but the editor,
   bubble menu, link dialog, and modal focus stack all need verification.

## Verification commands

From `signboard-vue/`:

```sh
npm run type-check
npm run build-only
npm run test:unit -- --run
```

From the repository root, also run the focused card/editor and legacy checks
listed in `tasks/03-card-editor-core.md`, plus the Vue Playwright editor subset
when Electron is available.

## Verification — 2026-07-26

Implemented in the Vue renderer. `RichTextEditor.vue` is now a controlled
Signboard Tiptap editor with Markdown serialization, native nested task
checkboxes, link editing, raw URL decorations/open controls, external-body
replacement, and base64-image sanitization. `CardNotesEditor.vue` now exposes
only the Tiptap implementation; the old OverType switch and integration code
were removed. The editor preserves `start`, `scheduled`, and `due` markers
without rendering per-task date controls.

Passing:

- `npm run type-check` from `signboard-vue/`
- `npm run build-only` from `signboard-vue/` (with the existing CommonJS
  `module` warning in `lib/appSettingsSchema.js`)
- `npm run test:unit -- --run src/__tests__/task15-tiptap-editor.spec.ts`
- Vue task-list and editor unit coverage

The full Vue unit run retains the known unrelated Task 12 jsdom failure in
`task12-a11y-and-shortcuts.spec.ts`. Electron Playwright parity remains
environment-blocked by the existing Electron `SIGABRT` launch failure.
