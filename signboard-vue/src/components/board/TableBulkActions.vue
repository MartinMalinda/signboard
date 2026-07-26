<script setup lang="ts">
import { ref } from 'vue'
import type { BoardLabel } from '../../types'

const props = defineProps<{
  count: number
  activeMenu: string
  labels: BoardLabel[]
  listOptions: Array<{ listPath: string; listDisplayName: string }>
  onToggleMenu: (menu: string) => void
  onArchive: () => void
  onMove: (listPath: string) => void
  onUpdateLabels: (mode: 'add' | 'remove', ids: string[]) => void
  onUpdateDate: (field: 'start' | 'due', value: string) => void
  onClear: () => void
}>()
const start = ref('')
const due = ref('')
const selectedLabelIds = ref<string[]>([])

function toggleLabel(id: string) {
  selectedLabelIds.value = selectedLabelIds.value.includes(id)
    ? selectedLabelIds.value.filter((candidate) => candidate !== id)
    : [...selectedLabelIds.value, id]
}
</script>

<template>
  <div class="board-table-bulk-toolbar" role="toolbar" aria-label="Bulk card actions">
    <span class="board-table-bulk-count">{{ props.count }} selected</span>
    <button class="board-table-bulk-button board-table-bulk-button-danger" type="button" @click="props.onArchive">Archive</button>
    <div class="board-table-bulk-menu-wrap"><button class="board-table-bulk-button" type="button" aria-haspopup="true" :aria-expanded="props.activeMenu === 'move'" @click="props.onToggleMenu('move')">Move</button><div v-if="props.activeMenu === 'move'" class="board-table-bulk-menu board-table-bulk-move-menu" role="group" aria-label="Move selected cards"><button v-for="list in props.listOptions" :key="list.listPath" class="board-table-bulk-menu-option" type="button" @click="props.onMove(list.listPath)">{{ list.listDisplayName }}</button></div></div>
    <div class="board-table-bulk-menu-wrap"><button class="board-table-bulk-button" type="button" aria-haspopup="true" :aria-expanded="props.activeMenu === 'labels'" @click="props.onToggleMenu('labels')">Labels</button><div v-if="props.activeMenu === 'labels'" class="board-table-bulk-menu board-table-bulk-labels-menu" role="group" aria-label="Update selected labels"><label v-for="label in props.labels" :key="label.id" class="board-table-bulk-label-row"><input type="checkbox" :checked="selectedLabelIds.includes(label.id)" :data-label-id="label.id" @change="toggleLabel(label.id)" />{{ label.name }}</label><div class="board-table-bulk-menu-actions"><button type="button" class="board-table-bulk-menu-option" @click="props.onUpdateLabels('add', selectedLabelIds)">Add labels</button><button type="button" class="board-table-bulk-menu-option" @click="props.onUpdateLabels('remove', selectedLabelIds)">Remove labels</button></div></div></div>
    <div class="board-table-bulk-menu-wrap"><button class="board-table-bulk-button" type="button" aria-haspopup="true" :aria-expanded="props.activeMenu === 'dates'" @click="props.onToggleMenu('dates')">Dates</button><div v-if="props.activeMenu === 'dates'" class="board-table-bulk-menu board-table-bulk-dates-menu" role="group" aria-label="Update selected dates"><div class="board-table-bulk-date-row"><label class="board-table-bulk-date-label">Start <input v-model="start" class="board-table-bulk-date-input" type="date" /></label><button type="button" class="board-table-bulk-button" @click="props.onUpdateDate('start', start)">Set</button><button type="button" class="board-table-bulk-button" @click="props.onUpdateDate('start', '')">Clear</button></div><div class="board-table-bulk-date-row"><label class="board-table-bulk-date-label">Due <input v-model="due" class="board-table-bulk-date-input" type="date" /></label><button type="button" class="board-table-bulk-button" @click="props.onUpdateDate('due', due)">Set</button><button type="button" class="board-table-bulk-button" @click="props.onUpdateDate('due', '')">Clear</button></div></div></div>
    <button class="board-table-bulk-button" type="button" @click="props.onClear">Clear</button>
  </div>
</template>
