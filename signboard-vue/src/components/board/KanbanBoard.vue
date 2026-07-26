<script setup lang="ts">
import { computed } from 'vue'
import { useBoardDataStore } from '../../stores/useBoardDataStore'
import { useBoardsStore } from '../../stores/useBoardsStore'
import { useUiStore } from '../../stores/useUiStore'
import { useSortable } from '../../composables/useSortable'
import ListColumn from './ListColumn.vue'
import AddListPhantom from './AddListPhantom.vue'
import { cardMatchesFilters } from '../../../lib/cardFilters.js'
import { useLabelsStore } from '../../stores/useLabelsStore'
import { useSearchStore } from '../../stores/useSearchStore'

const data = useBoardDataStore()
const boards = useBoardsStore()
const ui = useUiStore()
const labelsStore = useLabelsStore()
const search = useSearchStore()
const props = defineProps<{ onOpen?: (path: string) => void; onAddCard?: (path: string) => void; onAddList?: (afterPath?: string) => void; onArchiveCard?: (path: string) => void; onLabelsChanged?: () => void }>()
const labels = computed(() => data.snapshot?.boardSettings?.labels || [])
const visibleCardPaths = computed(() => new Map(data.lists.map((list) => [list.listPath, new Set(list.cards.filter((card) => cardMatchesFilters(card, { query: search.query, selectedLabelIds: labelsStore.filterIds, dateFilter: labelsStore.dateFilter, isCompletedList: labelsStore.isCompletedList(list.listName) })).map((card) => card.cardPath))])))

useSortable(() => document.getElementById('board'), {
  kind: 'lists',
  draggable: '.list:not(.add-list-phantom)',
  filter: '.add-list-phantom, .list-actions-button, .list-name',
  async onEnd(event) {
    const finalOrder = [...event.to.querySelectorAll<HTMLElement>('.list:not(.add-list-phantom)')]
      .map((list) => list.dataset.path || '').filter(Boolean)
    try {
      if (!window.board.reorderLists) throw new Error('List reorder is unavailable.')
      await window.board.reorderLists(finalOrder)
      await data.reconcileAfterMutation(boards.activeBoardPath)
    } catch (error) {
      console.error('Failed to reorder lists.', error)
      ui.announceStatus('List order could not be saved.')
      await data.reconcileAfterMutation(boards.activeBoardPath)
    }
  },
})
</script>

<template>
  <template v-if="data.snapshot">
    <ListColumn v-for="list in data.lists" :key="list.listPath" :list="list" :labels="labels" :visible-card-paths="visibleCardPaths.get(list.listPath)" :on-open="props.onOpen" :on-add-card="props.onAddCard" :on-archive-card="props.onArchiveCard" :on-labels-changed="props.onLabelsChanged" />
    <AddListPhantom :on-add="props.onAddList" />
  </template>
</template>
