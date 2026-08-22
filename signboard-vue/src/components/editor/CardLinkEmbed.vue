<script setup lang="ts">
import { computed } from 'vue'
import { resolveRelativeCardLink } from '../../../lib/cardLinks'
import { useBoardDataStore } from '../../stores/useBoardDataStore'
import { useEditorStore } from '../../stores/useEditorStore'
import { useLabelsStore } from '../../stores/useLabelsStore'
import type { CardSnapshot } from '../../types'
import CardItem from '../board/CardItem.vue'
import { getCardDisplayTitle } from '../../../lib/cardTitle.js'

const props = defineProps<{ href: string; title: string }>()
const boardData = useBoardDataStore()
const editor = useEditorStore()
const labelsStore = useLabelsStore()

function comparablePath(value: unknown) {
  return String(value || '').replace(/\\/g, '/').replace(/\/+$/, '')
}

function signboardCardId(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'signboard:' ? String(parsed.searchParams.get('id') || '').trim() : ''
  } catch {
    return ''
  }
}

const cards = computed(() => boardData.lists.flatMap((list) => list.cards))
const resolvedPath = computed(() => resolveRelativeCardLink(props.href, editor.cardPath))
const resolvedId = computed(() => signboardCardId(props.href))
const linkedCard = computed(() => {
  const path = comparablePath(resolvedPath.value)
  const id = resolvedId.value
  return cards.value.find((card) => (path && comparablePath(card.cardPath) === path)
    || (id && String(card.frontmatter?.signboard_id || '').trim() === id))
})
const fallbackCard = computed<CardSnapshot>(() => ({
  cardName: props.title || resolvedPath.value || props.href,
  cardPath: resolvedPath.value || props.href,
  displayTitle: getCardDisplayTitle(props.title, resolvedPath.value || props.href),
  frontmatter: { title: props.title || '' },
  body: '',
  taskSummary: { total: 0, completed: 0, remaining: 0 },
  taskStartDates: [],
  incompleteTaskStartDates: [],
  taskDueDates: [],
  incompleteTaskDueDates: [],
}))
const card = computed(() => linkedCard.value || fallbackCard.value)
</script>

<template>
  <span class="card-link-embed-card" aria-hidden="true">
    <CardItem :card="card" :labels="labelsStore.labels" presentation-only />
  </span>
</template>
