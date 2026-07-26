<script setup lang="ts">
const props = defineProps<{ value: string; onChange: (value: string) => void }>()
function preventEnter(event: KeyboardEvent) { if (event.key === 'Enter') event.preventDefault() }
</script>
<template>
  <h2 id="cardEditorTitle" contenteditable="true" role="textbox" aria-label="Card title" aria-multiline="false" spellcheck="true" @keydown="preventEnter" @input="props.onChange(($event.target as HTMLElement).textContent || '')">{{ value }}</h2>
</template>

