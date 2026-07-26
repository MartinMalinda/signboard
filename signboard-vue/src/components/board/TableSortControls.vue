<script setup lang="ts">
import { TABLE_SORT_OPTIONS } from '../../../lib/tableView.js'

defineProps<{
  sortKey: string
  listFilter: string
  listOptions: Array<{ listPath: string; listDisplayName: string; isCompletedList: boolean }>
  onSort: (event: Event) => void
  onListFilter: (event: Event) => void
}>()
</script>

<template>
  <label class="board-table-filter-control"><span class="board-table-filter-label">List</span><select class="board-table-filter-select" aria-label="Filter table by list" :value="listFilter" @change="onListFilter"><option value="all">All lists</option><option value="completed" :disabled="!listOptions.some((list) => list.isCompletedList)">Completed lists</option><optgroup label="Lists"><option v-for="list in listOptions" :key="list.listPath" :value="`list:${list.listPath}`">{{ list.listDisplayName }}</option></optgroup></select></label>
  <label class="board-table-sort-control"><span class="board-table-sort-label">Sort</span><select class="board-table-sort-select" aria-label="Sort table cards" :value="sortKey" @change="onSort"><option v-for="option in TABLE_SORT_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option></select></label>
</template>
