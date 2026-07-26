<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BoardLabel, BoardListSnapshot } from '../../types'
import CardItem from './CardItem.vue'
import { useSortable } from '../../composables/useSortable'
import { useBoardsStore } from '../../stores/useBoardsStore'
import { useBoardDataStore } from '../../stores/useBoardDataStore'
import ListColumnHeader from './ListColumnHeader.vue'
import { useUiStore } from '../../stores/useUiStore'

const props = defineProps<{ list: BoardListSnapshot; labels: BoardLabel[]; visibleCardPaths?: Set<string>; onOpen?: (path: string) => void; onAddCard?: (path: string) => void; onArchiveCard?: (path: string) => void; onLabelsChanged?: () => void; onListChanged?: () => void }>()
const displayName = computed(() => props.list.listName.replace(/^\d{3}-/, '').replace(/-(?:stock|[^-]{5})$/, ''))
const headingId = computed(() => `list-name-${props.list.listName.replace(/[^a-zA-Z0-9_-]/g, '-')}`)
const cards = ref<HTMLElement | null>(null)
const boards = useBoardsStore()
const data = useBoardDataStore()
const ui = useUiStore()

useSortable(cards, {
  kind: 'cards',
  group: 'cards',
  draggable: '.card',
  async onEnd(event) {
    const targetListPath = event.to.dataset.path || ''
    const finalOrder = [...event.to.querySelectorAll<HTMLElement>('.card')]
      .map((card) => card.dataset.path || '').filter(Boolean)
    try {
      if (!targetListPath || !window.board.reorderCardsInList) throw new Error('Card reorder is unavailable.')
      await window.board.reorderCardsInList(targetListPath, finalOrder)
      await data.reconcileAfterMutation(boards.activeBoardPath)
    } catch (error) {
      console.error('Failed to reorder cards.', error)
      ui.announceStatus('Card order could not be saved.')
      await data.reconcileAfterMutation(boards.activeBoardPath)
    }
  },
})
</script>

<template>
  <section class="list" :data-path="list.listPath" role="region" :aria-labelledby="headingId">
    <ListColumnHeader :id="headingId" :list="list" :display-name="displayName" :on-add-card="props.onAddCard" :on-list-changed="props.onListChanged" />
    <div ref="cards" class="cards" :data-path="list.listPath" role="list" :aria-label="`${displayName} cards`">
      <CardItem v-for="card in list.cards" :key="card.cardPath" :card="card" :labels="labels" :is-visible="props.visibleCardPaths?.has(card.cardPath) !== false" :on-open="props.onOpen" :on-archive="props.onArchiveCard" :on-labels-changed="props.onLabelsChanged" />
    </div>
  </section>
</template>
