<script setup lang="ts">
import { computed } from 'vue'
import FeatherIcon from '../FeatherIcon.vue'

const props = defineProps<{ cardPath: string; listPaths: string[]; onMove: (path: string) => Promise<boolean> }>()
const currentIndex = computed(() => props.listPaths.findIndex((path) => props.cardPath.startsWith(`${path}/`)))
const nextPath = computed(() => props.listPaths[currentIndex.value === props.listPaths.length - 1 ? Math.max(0, currentIndex.value - 1) : currentIndex.value + 1] || '')
</script>
<template>
  <div class="cardEditorListControl">
    <span id="cardEditorListMoveFeedback" aria-hidden="true">✓</span>
    <button id="cardEditorMoveListLink" type="button" title="Move to adjacent list" aria-label="Move card to adjacent list" :disabled="!nextPath" @click="props.onMove(nextPath)"><FeatherIcon name="arrow-right" /></button>
  </div>
</template>
