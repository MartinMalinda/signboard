<script setup lang="ts">
import { computed } from 'vue'
import { buildPlannerBuckets, formatPlannerIsoDate } from '../../../lib/planner.js'
import { usePlannerStore } from '../../stores/usePlannerStore'
import type { SortableEventLike } from '../../composables/useSortable'
import PlannerDropZone from './PlannerDropZone.vue'

const props = defineProps<{ onOpen: (entry: any) => void; onDrop: (event: SortableEventLike) => void | Promise<void> }>()
const planner = usePlannerStore()
const monthLabel = computed(() => new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(planner.monthCursor))
const days = computed(() => {
  const cursor = planner.monthCursor
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const total = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
  const offset = (first.getDay() + 6) % 7
  return Array.from({ length: Math.ceil((offset + total) / 7) * 7 }, (_, index) => {
    const day = index - offset + 1
    if (day < 1 || day > total) return { iso: '', day: 0, outside: true, weekend: index % 7 >= 5 }
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), day)
    return { iso: formatPlannerIsoDate(date), day, outside: false, weekend: index % 7 >= 5 }
  })
})
const today = computed(() => formatPlannerIsoDate(new Date()))
const currentMonth = computed(() => `${planner.monthCursor.getFullYear()}-${String(planner.monthCursor.getMonth() + 1).padStart(2, '0')}`)
const isCurrentMonth = computed(() => monthLabel.value === new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date()))
const buckets = computed(() => buildPlannerBuckets(planner.entries, (date) => date.startsWith(currentMonth.value), { searchQuery: planner.searchQuery, dateFilter: planner.dateFilter, showCompletedCards: planner.showCompletedCards, selectedLabelIds: planner.selectedLabelIds }))
function previous() { planner.shiftMonth(-1) }
function next() { planner.shiftMonth(1) }
</script>

<template>
  <section class="planner-view planner-calendar board-calendar" :class="{ 'has-empty-notice': !buckets.size }">
    <div class="board-calendar-header board-calendar-header--month planner-date-header"><div class="board-calendar-nav"><button class="board-calendar-nav-button" type="button" title="Previous month" aria-label="Previous month" @click="previous">‹</button><button class="board-calendar-nav-button" type="button" title="Next month" aria-label="Next month" @click="next">›</button><button class="board-calendar-today-button" type="button" title="Jump to current month" :disabled="isCurrentMonth" @click="planner.monthToday">Today</button></div><h2 class="board-calendar-month-label">{{ monthLabel }}</h2></div>
    <div class="board-calendar-weekday-header"><span v-for="day in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']" :key="day">{{ day }}</span></div>
    <div class="board-calendar-grid">
      <div v-for="(cell, index) in days" :key="cell.iso || `outside-${index}`" class="board-calendar-day" :class="{ 'board-calendar-day--outside': cell.outside, 'is-weekend': cell.weekend, 'is-today': cell.iso === today }" :data-date="cell.iso" :aria-hidden="cell.outside ? 'true' : undefined">
        <template v-if="!cell.outside"><header class="board-calendar-day-header"><span class="board-calendar-day-number">{{ cell.day }}</span><span v-if="cell.iso === today" class="board-calendar-today-badge">Today</span></header><PlannerDropZone :date="cell.iso" :entries="buckets.get(cell.iso) || []" class-name="board-calendar-day-cards" month="" group="planner-calendar-cards" card-class-name="planner-calendar-card" :on-open="props.onOpen" :on-drop="props.onDrop" /></template>
      </div>
    </div>
    <div v-if="!buckets.size" class="planner-empty-state">No dated cards are visible for this month. Add card or task start/due dates, or clear Planner filters.</div>
  </section>
</template>
