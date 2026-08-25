<script setup lang="ts">
import type { BoardLabel } from '../../types'

const props = defineProps<{ labels: BoardLabel[]; modelValue: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

function updateLabel(labelId: string, checked: boolean) {
  const next = new Set(props.modelValue)
  if (checked) next.add(labelId)
  else next.delete(labelId)
  emit('update:modelValue', [...next])
}
</script>

<template>
  <div class="quick-add-label-options">
    <label v-for="label in labels" :key="label.id" class="quick-add-label-option" :class="{ 'is-selected': modelValue.includes(label.id) }">
      <input type="checkbox" :checked="modelValue.includes(label.id)" :value="label.id" @change="updateLabel(label.id, ($event.target as HTMLInputElement).checked)">
      <span>{{ label.name }}</span>
    </label>
  </div>
</template>
