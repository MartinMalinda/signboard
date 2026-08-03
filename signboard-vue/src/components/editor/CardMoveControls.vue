<script setup lang="ts">
import { computed } from 'vue'
import { getListDisplayName } from '../../../lib/listNaming.js'

const props = defineProps<{ cardPath: string; listPaths: string[]; onMove: (path: string) => Promise<boolean> }>()
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
  <div class="cardEditorListControl">
    <label class="card-editor-stage-select">
      <select id="cardEditorV2StageSelect" :value="currentPath" aria-label="Move card to stage" @change="moveToStage">
        <option v-for="path in props.listPaths" :key="path" :value="path">{{ displayName(path) }}</option>
      </select>
    </label>
  </div>
</template>

<style scoped>
.cardEditorListControl { min-width: 0; }
.card-editor-stage-select { display: grid; min-width: 150px; gap: 3px; color: var(--muted, #6b7280); font-size: 11px; }
.card-editor-stage-select select { box-sizing: border-box; width: 100%; min-width: 0; min-height: 32px; height: 32px; padding: 5px 6px; border: 1px solid var(--border, #e6e8ec); border-radius: 5px; background: var(--surface, #fff); color: var(--text, #111827); font: inherit; font-size: 13px; line-height: 1.2; }
</style>
