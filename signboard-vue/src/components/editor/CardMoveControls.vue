<script setup lang="ts">
import { computed } from 'vue'
import { getListDisplayName } from '../../../lib/listNaming.js'

const props = defineProps<{ cardPath: string; listPaths: string[]; onMove: (path: string) => Promise<boolean>; compact?: boolean }>()
const currentIndex = computed(() => props.listPaths.findIndex((path) => props.cardPath.startsWith(`${path}/`)))
const currentPath = computed(() => props.listPaths[currentIndex.value] || '')

function displayName(path: string) {
  return getListDisplayName(path.split('/').pop() || '') || path
}

function moveToStage(event: Event) {
  const nextPath = String((event.target as HTMLSelectElement).value || '')
  if (nextPath && nextPath !== currentPath.value) props.onMove(nextPath)
}
</script>
<template>
  <div class="cardEditorListControl" :class="{ 'is-compact': props.compact }">
    <label class="card-editor-stage-select" :class="{ 'is-compact': props.compact }">
      <select id="cardEditorV2StageSelect" :value="currentPath" aria-label="Move card to stage" @change="moveToStage">
        <option v-for="path in props.listPaths" :key="path" :value="path">{{ displayName(path) }}</option>
      </select>
    </label>
  </div>
</template>

<style scoped>
.cardEditorListControl { min-width: 0; }
.cardEditorListControl.is-compact { margin-left: 2px; padding-left: 2px; border-left: 1px solid color-mix(in oklab, var(--border, #e6e8ec) 74%, var(--bg-card, #fff)); }
.card-editor-stage-select { display: grid; min-width: 150px; gap: 3px; color: var(--muted, #6b7280); font-size: 11px; }
.card-editor-stage-select.is-compact { display: block; min-width: 94px; }
.card-editor-stage-select select { box-sizing: border-box; width: 100%; min-width: 0; min-height: 32px; height: 32px; padding: 5px 6px; border: 1px solid var(--border, #e6e8ec); border-radius: 5px; background: var(--surface, #fff); color: var(--text, #111827); font: inherit; font-size: 13px; line-height: 1.2; }
.card-editor-stage-select.is-compact select { height: 26px; padding: 0 22px 0 9px; border: 0; border-radius: 6px; background: transparent; color: var(--text, currentColor); font-size: 12px; font-weight: 550; cursor: pointer; }
.card-editor-stage-select.is-compact select:hover, .card-editor-stage-select.is-compact select:focus-visible { background: color-mix(in oklab, var(--accent, #0b5fff) 7%, var(--bg-card, #fff)); color: var(--text, currentColor); }
.card-editor-stage-select.is-compact select:focus-visible { outline: 2px solid var(--accent, currentColor); outline-offset: 1px; }
</style>
