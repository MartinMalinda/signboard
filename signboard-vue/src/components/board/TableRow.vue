<script setup lang="ts">
import type { BoardLabel } from '../../types'
import { createCardTimestampCellValue, formatCardTimestampDateTime, getTableDisplayDate } from '../../../lib/tableView.js'

const props = defineProps<{
  entry: any
  labels: BoardLabel[]
  listOptions: Array<{ listPath: string; listDisplayName: string }>
  selected: boolean
  onSelect: (entry: any, event: Event) => void
  onOpen?: (entry: any) => void
  onMove: (entry: any, event: Event) => void
}>()

function displayDate(field: 'start' | 'due') {
  const value = getTableDisplayDate(props.entry, field)
  return value.dates[0] ? `${value.prefix}${value.dates[0]}` : 'None'
}

function taskText() {
  const total = Number(props.entry?.taskSummary?.total || 0)
  const completed = Number(props.entry?.taskSummary?.completed || 0)
  return total ? `${completed}/${total}` : 'None'
}

function timestamp(field: 'createdAt' | 'updatedAt') {
  const value = props.entry?.timestamps?.[field]
  return value ? createCardTimestampCellValue(value) : 'Unknown'
}

function open() {
  props.onOpen?.(props.entry)
}
</script>

<template>
  <tr class="board-table-row" :class="{ 'is-selected': props.selected }" :data-path="props.entry.cardPath" :data-list-path="props.entry.listPath" :aria-selected="props.selected ? 'true' : 'false'" @click="open">
    <td class="board-table-cell board-table-cell-select"><input class="board-table-select-checkbox" type="checkbox" :aria-label="`Select ${props.entry.title}`" :checked="props.selected" @click.stop="props.onSelect(props.entry, $event)" /></td>
    <td class="board-table-cell board-table-cell-start"><span class="board-table-start" :class="{ 'board-table-empty-value': displayDate('start') === 'None' }">{{ displayDate('start') }}</span></td>
    <td class="board-table-cell board-table-cell-due"><span class="board-table-due" :class="{ 'board-table-empty-value': displayDate('due') === 'None' }">{{ displayDate('due') }}</span></td>
    <td class="board-table-cell board-table-cell-updated"><time v-if="props.entry.timestamps?.updatedAt" class="board-table-timestamp" :datetime="props.entry.timestamps.updatedAt" :title="formatCardTimestampDateTime(props.entry.timestamps.updatedAt)">{{ timestamp('updatedAt') }}</time><span v-else class="board-table-empty-value">Unknown</span></td>
    <td class="board-table-cell board-table-cell-created"><time v-if="props.entry.timestamps?.createdAt" class="board-table-timestamp" :datetime="props.entry.timestamps.createdAt" :title="formatCardTimestampDateTime(props.entry.timestamps.createdAt)">{{ timestamp('createdAt') }}</time><span v-else class="board-table-empty-value">Unknown</span></td>
    <td class="board-table-cell board-table-cell-tasks"><span class="board-table-task-progress">{{ taskText() }}</span></td>
    <td class="board-table-cell board-table-cell-links"><span v-if="props.entry.linkedObjectCount" class="board-table-linked-objects-badge" :aria-label="`${props.entry.linkedObjectCount} linked objects`">{{ props.entry.linkedObjectCount }}</span><span v-else class="board-table-empty-value">None</span></td>
    <td class="board-table-cell board-table-cell-title"><button class="board-table-card-title-button" type="button" :aria-label="`Open ${props.entry.title}`" @click.stop="open">{{ props.entry.title }}</button></td>
    <td class="board-table-cell board-table-cell-list"><select class="board-table-list-select" :aria-label="`Move ${props.entry.title} to list`" :value="props.entry.listPath" @click.stop @change.stop="props.onMove(props.entry, $event)"><option v-for="list in props.listOptions" :key="list.listPath" :value="list.listPath">{{ list.listDisplayName }}</option></select></td>
    <td class="board-table-cell board-table-cell-labels"><div class="board-table-labels"><span v-for="label in props.labels.filter((candidate) => props.entry.labels.includes(candidate.id))" :key="label.id" class="card-label-chip">{{ label.name }}</span><span v-if="!props.labels.some((candidate) => props.entry.labels.includes(candidate.id))" class="board-table-empty-value">None</span></div></td>
  </tr>
</template>
