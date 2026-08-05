<script setup lang="ts">
import { computed } from 'vue'
import { useBoardDataStore } from '../../stores/useBoardDataStore'
import { useEditorStore } from '../../stores/useEditorStore'
import CardMoveControls from './CardMoveControls.vue'

const props = defineProps<{ listPaths: string[]; onMove: (path: string) => Promise<boolean> }>()
const editor = useEditorStore()
const data = useBoardDataStore()

const KIND_OPTIONS = ['task', 'discovery', 'epic', 'incident']
const WORK_TYPE_OPTIONS = ['product', 'ux', 'security', 'correctness', 'data_integrity', 'reliability', 'performance', 'compliance', 'privacy', 'engineering_health', 'technical_debt', 'observability', 'operations', 'enablement', 'discovery', 'documentation']
const PRIORITY_OPTIONS = ['', 'P0', 'P1', 'P2', 'P3']

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function clone(value: unknown): Record<string, unknown> {
  return isObject(value) ? JSON.parse(JSON.stringify(value)) as Record<string, unknown> : {}
}

const profileDefaults = computed(() => data.snapshot?.v2?.profile?.cardDefaults || {})
const v2Metadata = computed(() => isObject(editor.frontmatter.signboard_v2) ? editor.frontmatter.signboard_v2 : {})
const kind = computed(() => String(v2Metadata.value.kind || profileDefaults.value.kind || 'task'))
const workType = computed(() => String(v2Metadata.value.work_type || profileDefaults.value.workType || 'product'))
const priority = computed(() => String(v2Metadata.value.priority_class || profileDefaults.value.priorityClass || 'P2').toUpperCase())

function label(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function updateV2(nextPartial: Record<string, unknown>) {
  const next = { ...clone(v2Metadata.value), contract_version: 1, ...nextPartial }
  editor.frontmatter = { ...editor.frontmatter, signboard_v2: next }
  editor.queueSave()
}

function updateCore(field: 'kind' | 'work_type' | 'priority_class', value: string) {
  updateV2({ [field]: value })
}
</script>

<template>
  <div class="v2-editor-toolbar-controls" role="group" aria-label="Work details">
    <select class="v2-editor-toolbar-select" :value="kind" :aria-label="`Kind: ${label(kind)}`" :title="`Kind: ${label(kind)}`" @change="updateCore('kind', ($event.target as HTMLSelectElement).value)">
      <option v-for="option in KIND_OPTIONS" :key="option" :value="option">{{ label(option) }}</option>
    </select>
    <select class="v2-editor-toolbar-select v2-editor-toolbar-select-work-type" :value="workType" :aria-label="`Work type: ${label(workType)}`" :title="`Work type: ${label(workType)}`" @change="updateCore('work_type', ($event.target as HTMLSelectElement).value)">
      <option v-for="option in WORK_TYPE_OPTIONS" :key="option" :value="option">{{ label(option) }}</option>
    </select>
    <select class="v2-editor-toolbar-select v2-editor-toolbar-select-priority" :value="priority" :aria-label="`Priority: ${priority}`" :title="`Priority: ${priority}`" @change="updateCore('priority_class', ($event.target as HTMLSelectElement).value)">
      <option v-for="option in PRIORITY_OPTIONS" :key="option" :value="option">{{ option || 'Unset' }}</option>
    </select>
    <CardMoveControls :card-path="editor.cardPath" :list-paths="props.listPaths" :on-move="props.onMove" compact />
  </div>
</template>

<style scoped>
.v2-editor-toolbar-controls {
  display: inline-flex;
  align-items: center;
  gap: 0;
  min-width: 0;
  padding: 0;
}
.v2-editor-toolbar-select {
  box-sizing: border-box;
  height: 26px;
  min-width: 72px;
  max-width: 118px;
  padding: 0 22px 0 9px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text, currentColor);
  font: inherit;
  font-size: 12px;
  font-weight: 550;
  cursor: pointer;
}
.v2-editor-toolbar-select-work-type { min-width: 84px; max-width: 142px; }
.v2-editor-toolbar-select-priority { min-width: 52px; max-width: 58px; }
.v2-editor-toolbar-select + .v2-editor-toolbar-select { border-left: 1px solid color-mix(in oklab, var(--border, #e6e8ec) 74%, var(--bg-card, #fff)); border-radius: 0; }
.v2-editor-toolbar-select:hover, .v2-editor-toolbar-select:focus-visible { background: color-mix(in oklab, var(--accent, #0b5fff) 7%, var(--bg-card, #fff)); color: var(--text, currentColor); }
.v2-editor-toolbar-select:focus-visible { outline: 2px solid var(--accent, currentColor); outline-offset: 1px; }
@media (max-width: 580px) { .v2-editor-toolbar-select-work-type { max-width: 104px; } .v2-editor-toolbar-select { max-width: 92px; } .v2-editor-toolbar-select-priority { max-width: 52px; } }
</style>
