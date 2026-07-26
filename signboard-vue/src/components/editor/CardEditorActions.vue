<script setup lang="ts">
import FeatherIcon from '../FeatherIcon.vue'
const props = defineProps<{ onArchive: () => void; onDuplicate: () => void }>()
</script>
<template>
  <button id="cardEditorArchiveLink" type="button" title="Archive" aria-label="Archive card" aria-keyshortcuts="Alt+Shift+Meta+Backspace" @click="props.onArchive"><FeatherIcon name="archive" /></button>
  <button id="cardEditorDupeLink" type="button" title="Duplicate" aria-label="Duplicate card" @click="props.onDuplicate"><FeatherIcon name="copy" /></button>
</template>
