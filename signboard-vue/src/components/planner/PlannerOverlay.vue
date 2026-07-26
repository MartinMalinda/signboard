<script setup lang="ts">
import { onMounted } from 'vue'
import type { SortableEventLike } from '../../composables/useSortable'
import { usePlannerStore } from '../../stores/usePlannerStore'
import PlannerHeader from './PlannerHeader.vue'
import PlannerCalendar from './PlannerCalendar.vue'
import PlannerThisWeek from './PlannerThisWeek.vue'
import PlannerDay from './PlannerDay.vue'
import PlannerAgenda from './PlannerAgenda.vue'

const props = defineProps<{ isOpen: boolean; onClose: () => void; onOpenCard: (path: string) => Promise<void> }>()
const planner = usePlannerStore()

onMounted(() => { void planner.load() })

async function openCard(entry: any) {
  await planner.openCard(entry, props.onOpenCard)
}

async function drop(event: SortableEventLike) {
  const item = event.item
  const sourceDate = String(event.from.dataset.date || '')
  const targetDate = String(event.to.dataset.date || '')
  const entry = planner.entries.find((candidate) => candidate.cardPath === item.dataset.path)
  if (!entry || !targetDate || sourceDate === targetDate) { await planner.load(); return }
  await planner.moveTemporalDate({ ...entry, temporalReason: item.dataset.temporalReason || entry.temporalReason, temporalTaskLineIndexes: String(item.dataset.taskLineIndexes || '').split(',').filter(Boolean).map(Number) }, sourceDate, targetDate)
  await planner.load()
}
</script>

<template>
  <section id="plannerOverlay" class="planner-overlay planner-overlay-vue" :class="{ hidden: !props.isOpen }" :aria-hidden="props.isOpen ? 'false' : 'true'" aria-labelledby="plannerTitle">
    <div class="planner-panel">
      <PlannerHeader :on-close="props.onClose" />
      <div id="plannerBody" class="planner-body">
        <div v-if="planner.loading" class="planner-empty-state" role="status">Loading Planner…</div>
        <div v-else-if="planner.errors.length" class="planner-source-warning">{{ planner.errors.length }} open board{{ planner.errors.length === 1 ? '' : 's' }} could not be loaded.</div>
        <PlannerCalendar v-if="planner.activeView === 'calendar'" :on-open="openCard" :on-drop="drop" />
        <PlannerThisWeek v-else-if="planner.activeView === 'this-week'" :on-open="openCard" :on-drop="drop" />
        <PlannerDay v-else-if="planner.activeView === 'day'" :on-open="openCard" />
        <PlannerAgenda v-else :on-open="openCard" />
      </div>
    </div>
  </section>
</template>
