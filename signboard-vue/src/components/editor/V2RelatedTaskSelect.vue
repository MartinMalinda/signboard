<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import FeatherIcon from '../FeatherIcon.vue'

export interface RelatedTaskOption {
  value: string
  label: string
  context?: string
}

const props = withDefaults(defineProps<{
  label: string
  modelValue: string[]
  options: RelatedTaskOption[]
  placeholder?: string
}>(), {
  placeholder: 'Search related tasks…',
})

const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()
const root = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const query = ref('')
const open = ref(false)
const activeIndex = ref(0)

const selectedValues = computed(() => [...new Set(props.modelValue.map((value) => String(value || '').trim()).filter(Boolean))])
const selectedSet = computed(() => new Set(selectedValues.value))
const selectedOptions = computed(() => selectedValues.value.map((value) => props.options.find((option) => option.value === value) || ({ value, label: value })))
const listboxId = computed(() => `v2-related-task-options-${props.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)
const filteredOptions = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase()
  return props.options.filter((option) => {
    if (selectedSet.value.has(option.value)) return false
    if (!normalizedQuery) return true
    return `${option.label} ${option.context || ''}`.toLowerCase().includes(normalizedQuery)
  })
})
const activeOption = computed(() => filteredOptions.value[activeIndex.value])

watch(filteredOptions, () => {
  activeIndex.value = Math.min(activeIndex.value, Math.max(0, filteredOptions.value.length - 1))
})

function optionId(index: number) {
  return `${listboxId.value}-${index}`
}

function openSelect() {
  open.value = true
}

function selectOption(option: RelatedTaskOption | undefined) {
  if (!option) return
  emit('update:modelValue', [...selectedValues.value, option.value])
  query.value = ''
  open.value = true
  void input.value?.focus()
}

function removeValue(value: string) {
  emit('update:modelValue', selectedValues.value.filter((selected) => selected !== value))
  void input.value?.focus()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    open.value = true
    if (filteredOptions.value.length) activeIndex.value = (activeIndex.value + 1) % filteredOptions.value.length
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    open.value = true
    if (filteredOptions.value.length) activeIndex.value = (activeIndex.value - 1 + filteredOptions.value.length) % filteredOptions.value.length
  } else if (event.key === 'Enter') {
    event.preventDefault()
    selectOption(activeOption.value)
  } else if (event.key === 'Escape') {
    if (open.value) {
      event.preventDefault()
      open.value = false
    }
  } else if (event.key === 'Backspace' && !query.value && selectedValues.value.length) {
    const lastValue = selectedValues.value[selectedValues.value.length - 1]
    if (lastValue) removeValue(lastValue)
  }
}

function onDocumentPointerDown(event: PointerEvent) {
  if (root.value && event.target instanceof Node && !root.value.contains(event.target)) open.value = false
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerDown))
</script>

<template>
  <div ref="root" class="v2-related-task-select">
    <span class="v2-related-task-label">{{ props.label }}</span>
    <div class="v2-related-task-control" :class="{ 'is-open': open }">
      <div v-if="selectedOptions.length" class="v2-related-task-chips" aria-label="Selected related tasks">
        <span v-for="option in selectedOptions" :key="option.value" class="v2-related-task-chip">
          <span class="v2-related-task-chip-label" :title="option.label">{{ option.label }}</span>
          <button type="button" :aria-label="`Remove ${option.label}`" title="Remove" @click="removeValue(option.value)"><FeatherIcon name="x" :size="12" /></button>
        </span>
      </div>
      <input
        ref="input"
        class="v2-related-task-input"
        type="search"
        role="combobox"
        autocomplete="off"
        :placeholder="props.placeholder"
        :value="query"
        aria-autocomplete="list"
        :aria-controls="listboxId"
        :aria-expanded="open"
        :aria-activedescendant="open && activeOption ? optionId(activeIndex) : undefined"
        @focus="openSelect"
        @input="query = ($event.target as HTMLInputElement).value; open = true; activeIndex = 0"
        @keydown="onKeydown"
      />
    </div>
    <div v-if="open" :id="listboxId" class="v2-related-task-options" role="listbox" aria-multiselectable="true" :aria-label="props.label">
      <button
        v-for="(option, index) in filteredOptions"
        :id="optionId(index)"
        :key="option.value"
        class="v2-related-task-option"
        :class="{ 'is-active': index === activeIndex }"
        type="button"
        role="option"
        :aria-selected="false"
        @mousedown.prevent
        @mouseenter="activeIndex = index"
        @click="selectOption(option)"
      >
        <span class="v2-related-task-option-label">{{ option.label }}</span>
        <span v-if="option.context" class="v2-related-task-option-context">{{ option.context }}</span>
      </button>
      <span v-if="!filteredOptions.length" class="v2-related-task-empty">No matching tasks</span>
    </div>
  </div>
</template>

<style scoped>
.v2-related-task-select { display: grid; position: relative; min-width: 0; max-width: 100%; gap: 4px; color: var(--muted, #6b7280); font-size: 11px; }
.v2-related-task-label { color: var(--muted, #6b7280); }
.v2-related-task-control { display: flex; flex-wrap: wrap; align-items: center; box-sizing: border-box; width: 100%; min-width: 0; max-width: 100%; gap: 5px; min-height: 32px; padding: 4px 6px; border: 1px solid var(--border, #e6e8ec); border-radius: 5px; background: var(--surface, #fff); }
.v2-related-task-control.is-open { border-color: var(--primary, #0b5fff); box-shadow: 0 0 0 2px color-mix(in oklab, var(--primary, #0b5fff) 16%, transparent); }
.v2-related-task-chips { display: flex; flex-wrap: wrap; min-width: 0; max-width: 100%; gap: 4px; }
.v2-related-task-chip { display: inline-flex; min-width: 0; max-width: 100%; align-items: center; gap: 3px; padding: 3px 4px 3px 7px; border: 1px solid color-mix(in oklab, var(--primary, #0b5fff) 28%, var(--border, #e6e8ec)); border-radius: 999px; background: color-mix(in oklab, var(--primary, #0b5fff) 8%, var(--surface, #fff)); color: var(--text, #111827); }
.v2-related-task-chip-label { display: block; min-width: 0; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.v2-related-task-chip button { display: inline-flex; align-items: center; justify-content: center; padding: 1px; border: 0; border-radius: 50%; background: transparent; color: var(--muted, #6b7280); cursor: pointer; }
.v2-related-task-chip button:hover, .v2-related-task-chip button:focus-visible { background: color-mix(in oklab, var(--primary, #0b5fff) 16%, transparent); color: var(--text, #111827); }
.v2-related-task-input { flex: 1 1 150px; min-width: 0; max-width: 100%; min-height: 20px; height: 20px; padding: 0; border: 0; outline: 0; background: transparent; color: var(--text, #111827); font: inherit; font-size: 13px; line-height: 20px; }
.v2-related-task-input::-webkit-search-cancel-button { display: none; }
.v2-related-task-options { position: absolute; z-index: 10; top: 100%; right: 0; left: 0; max-height: 220px; overflow-y: auto; padding: 4px; border: 1px solid var(--border, #e6e8ec); border-radius: 6px; background: var(--surface, #fff); box-shadow: 0 8px 24px rgb(15 23 42 / 14%); }
.v2-related-task-option { display: grid; width: 100%; gap: 2px; padding: 7px 8px; border: 0; border-radius: 4px; background: transparent; color: var(--text, #111827); text-align: left; cursor: pointer; }
.v2-related-task-option:hover, .v2-related-task-option.is-active { background: color-mix(in oklab, var(--primary, #0b5fff) 10%, var(--surface, #fff)); }
.v2-related-task-option-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.v2-related-task-option-context { color: var(--muted, #6b7280); font-size: 10px; }
.v2-related-task-empty { display: block; padding: 8px; color: var(--muted, #6b7280); }
</style>
