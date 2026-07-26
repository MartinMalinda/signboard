<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useDatepicker } from '../../composables/useDatepicker'
import FeatherIcon from '../FeatherIcon.vue'

const props = defineProps<{ start?: string; due?: string; onChange: (kind: 'start' | 'due', value: string) => void }>()
const open = ref(false)
const datepicker = useDatepicker()
const label = computed(() => {
  if (props.start && props.due) return props.start === props.due ? props.start : `${props.start} – ${props.due}`
  if (props.start) return `Starts ${props.start}`
  if (props.due) return `Due ${props.due}`
  return ''
})
function change(kind: 'start' | 'due', event: Event) { props.onChange(kind, (event.target as HTMLInputElement).value) }
function pick(kind: 'start' | 'due', event: MouseEvent) {
  const trigger = event.currentTarget as HTMLElement
  datepicker.open(trigger, kind === 'start' ? props.start || '' : props.due || '', (value) => props.onChange(kind, value))
}
onBeforeUnmount(datepicker.close)
</script>
<template>
  <div class="card-editor-dates-control">
    <button id="cardEditorSetDatesLink" type="button" title="Edit Dates" aria-label="Edit dates" @click="open = !open"><FeatherIcon name="calendar" /> <span id="cardEditorCardDatesDisplay" title="This card's dates">{{ label }}</span></button>
    <div v-if="open" class="label-popover card-editor-dates-popover" role="dialog" aria-label="Card dates">
      <label>Start <input type="date" :value="start || ''" @change="change('start', $event)" /> <button type="button" aria-label="Choose start date" @click="pick('start', $event)">📅</button></label>
      <label>Due <input type="date" :value="due || ''" @change="change('due', $event)" /> <button type="button" aria-label="Choose due date" @click="pick('due', $event)">📅</button></label>
      <button type="button" @click="onChange('start', '')">Clear start</button>
      <button type="button" @click="onChange('due', '')">Clear due</button>
    </div>
  </div>
</template>
