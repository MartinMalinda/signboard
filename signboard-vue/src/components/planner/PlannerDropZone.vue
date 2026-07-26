<script setup lang="ts">
import { ref } from 'vue'
import { useSortable, type SortableEventLike } from '../../composables/useSortable'
import PlannerTemporalCard from './PlannerTemporalCard.vue'

const props = defineProps<{ date: string; entries: any[]; className: string; group: string; month?: string; cardClassName: string; onOpen: (entry: any) => void; onDrop: (event: SortableEventLike) => void | Promise<void> }>()
const root = ref<HTMLElement | null>(null)
useSortable(root, { kind: 'cards', group: props.group, draggable: `.${props.cardClassName}`, onEnd: props.onDrop })
</script>

<template>
  <div ref="root" :class="props.className" :data-date="props.date" :data-month="props.month">
    <PlannerTemporalCard v-for="entry in props.entries" :key="`${entry.cardPath}-${entry.temporalReason}-${entry.temporalTaskLineIndexes?.join(',')}`" :entry="entry" :iso-date="props.date" :class-name="props.cardClassName" :on-open="props.onOpen" />
  </div>
</template>
