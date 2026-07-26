<script setup lang="ts">
import { computed, onUpdated, ref } from 'vue'
import { waitForNativeSelectChangeToSettle } from '../../composables/useNativeMenuSettle'
import FeatherIcon from '../FeatherIcon.vue'

const props = defineProps<{ cardPath: string; listPaths: string[]; onMove: (path: string) => Promise<boolean> }>()
const selected = ref(props.listPaths.find((path) => props.cardPath.startsWith(`${path}/`)) || '')
let lastCardPath = props.cardPath
onUpdated(() => {
  const current = props.listPaths.find((path) => props.cardPath.startsWith(`${path}/`)) || ''
  if (props.cardPath !== lastCardPath || !props.listPaths.includes(selected.value)) {
    selected.value = current
    lastCardPath = props.cardPath
  }
})
const currentIndex = computed(() => props.listPaths.indexOf(selected.value))
const nextPath = computed(() => props.listPaths[currentIndex.value === props.listPaths.length - 1 ? Math.max(0, currentIndex.value - 1) : currentIndex.value + 1] || '')
async function change(event: Event) {
  const select = event.target as HTMLSelectElement
  if (!await waitForNativeSelectChangeToSettle(select, select.value)) return
  if (select.value !== selected.value) { selected.value = select.value; await props.onMove(select.value) }
}
</script>
<template>
  <div class="cardEditorListControl">
    <select id="cardEditorListSelect" title="Move card to list" aria-label="Move card to list" :value="selected" @change="change">
      <option v-for="path in listPaths" :key="path" :value="path">{{ path.split('/').filter(Boolean).pop()?.replace(/^\d{3}-/, '') }}</option>
    </select>
    <span id="cardEditorListMoveFeedback" aria-hidden="true">✓</span>
    <button id="cardEditorMoveListLink" type="button" title="Move to adjacent list" aria-label="Move card to adjacent list" :disabled="!nextPath" @click="props.onMove(nextPath)"><FeatherIcon name="arrow-right" /></button>
  </div>
</template>
