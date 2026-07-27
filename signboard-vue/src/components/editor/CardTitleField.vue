<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{ value: string; onChange: (value: string) => void }>()

const titleElement = ref<HTMLElement | null>(null)

function syncTitleElement(value: string) {
  if (titleElement.value && titleElement.value.textContent !== value) {
    titleElement.value.textContent = value
  }
}

function preventEnter(event: KeyboardEvent) { if (event.key === 'Enter') event.preventDefault() }

watch(() => props.value, syncTitleElement)
onMounted(() => syncTitleElement(props.value))
</script>
<template>
  <h2 ref="titleElement" id="cardEditorTitle" contenteditable="true" role="textbox" aria-label="Card title" aria-multiline="false" spellcheck="true" @keydown="preventEnter" @input="props.onChange(($event.target as HTMLElement).textContent || '')"></h2>
</template>
