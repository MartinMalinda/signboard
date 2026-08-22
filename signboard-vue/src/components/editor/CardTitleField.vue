<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{ value: string; placeholder?: string; onChange: (value: string) => void }>(), { placeholder: '' })

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
  <h2 ref="titleElement" id="cardEditorTitle" :data-placeholder="props.placeholder" :class="{ 'is-empty': !props.value }" contenteditable="true" role="textbox" aria-label="Card title" :aria-description="props.value ? undefined : 'Optional. When empty, the filename is used.'" aria-multiline="false" spellcheck="true" @keydown="preventEnter" @input="props.onChange(($event.target as HTMLElement).textContent || '')"></h2>
</template>
