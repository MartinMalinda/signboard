<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BoardLabel, BoardListSnapshot } from '../../types'
import CardItem from './CardItem.vue'
import Lazy from './Lazy.vue'
import { useSortable } from '../../composables/useSortable'
import { useBoardsStore } from '../../stores/useBoardsStore'
import { useBoardDataStore } from '../../stores/useBoardDataStore'
import ListColumnHeader from './ListColumnHeader.vue'
import { useUiStore } from '../../stores/useUiStore'
import { getListDisplayName } from '../../../lib/listNaming.js'
import { getCardBodyPreviewText } from '../../lib/cardPreview'

const props = defineProps<{ list: BoardListSnapshot; labels?: BoardLabel[]; visibleCardPaths?: Set<string>; onOpen?: (path: string) => void; onAddCard?: (path: string) => void; onArchiveCard?: (path: string) => void; onDuplicateCard?: (path: string) => void; onListChanged?: () => void }>()
const displayName = computed(() => getListDisplayName(props.list.listName))
const headingId = computed(() => `list-name-${props.list.listName.replace(/[^a-zA-Z0-9_-]/g, '-')}`)
const cards = ref<HTMLElement | null>(null)
const boards = useBoardsStore()
const data = useBoardDataStore()
const ui = useUiStore()

function estimateCardHeight(card: BoardListSnapshot['cards'][number]) {
  const title = String(card.frontmatter?.title || '').replace('# ', '') || 'Untitled'
  const preview = getCardBodyPreviewText(card.body)
  const titleLines = Math.max(1, Math.ceil(title.length / 30))
  const previewLines = preview ? Math.min(2, Math.max(1, Math.ceil(preview.length / 38))) : 0
  const hasMetadata = Boolean(card.taskSummary.total || card.frontmatter?.start || card.frontmatter?.due || card.frontmatter?.linked_objects)

  return Math.max(96, 22 + (titleLines * 21) + 6 + (previewLines ? (previewLines * 20) + 8 : 0) + (hasMetadata ? 24 : 0) + 8)
}

useSortable(cards, {
  kind: 'cards',
  group: 'cards',
  draggable: '.lazy-card',
  async onEnd(event) {
    const targetListPath = event.to.dataset.path || ''
    const finalOrder = [...event.to.querySelectorAll<HTMLElement>('.lazy-card > .card')]
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
    <div ref="cards" class="cards" :data-path="list.listPath" role="list" tabindex="0" :aria-label="`${displayName} cards`">
      <Lazy v-for="card in list.cards" :key="card.cardPath" once :root="cards" :height="estimateCardHeight(card)" :class="{ 'lazy-card-filtered-out': props.visibleCardPaths?.has(card.cardPath) === false }">
        <CardItem :card="card" :labels="props.labels" :is-visible="true" :on-open="props.onOpen" :on-archive="props.onArchiveCard" :on-duplicate="props.onDuplicateCard" />
      </Lazy>
    </div>
  </section>
</template>
