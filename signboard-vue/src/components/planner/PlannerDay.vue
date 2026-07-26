<script setup lang="ts">
import { computed } from 'vue'
import { formatPlannerIsoDate, getPlannerVisibleDates, createPlannerPlacement } from '../../../lib/planner.js'
import { usePlannerStore } from '../../stores/usePlannerStore'
import PlannerTemporalCard from './PlannerTemporalCard.vue'

const props = defineProps<{ onOpen: (entry: any) => void }>()
const planner = usePlannerStore()
const date = computed(() => formatPlannerIsoDate(planner.dayCursor))
const entries = computed(() => planner.entries.flatMap((entry) => getPlannerVisibleDates(entry, { searchQuery: planner.searchQuery, dateFilter: planner.dateFilter, showCompletedCards: planner.showCompletedCards, selectedLabelIds: planner.selectedLabelIds }).filter((value) => value === date.value).map(() => createPlannerPlacement(entry, date.value)).filter(Boolean)))
const label = computed(() => new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(planner.dayCursor))
</script>

<template><section class="planner-view planner-day"><div class="board-calendar-header planner-date-header"><div class="board-calendar-nav"><button class="board-calendar-nav-button" type="button" title="Previous day" aria-label="Previous day" @click="planner.shiftDay(-1)">‹</button><button class="board-calendar-nav-button" type="button" title="Next day" aria-label="Next day" @click="planner.shiftDay(1)">›</button><button class="board-calendar-today-button" type="button" title="Jump to today" @click="planner.dayToday">Today</button></div><h2 class="board-calendar-month-label">{{ label }}</h2></div><div class="planner-list-view"><PlannerTemporalCard v-for="entry in entries" :key="`${entry.cardPath}-${entry.temporalReason}`" :entry="entry" :iso-date="date" class-name="planner-list-card" :on-open="props.onOpen" /><div v-if="!entries.length" class="planner-empty-state">No dated cards are visible for this day. Add card or task start/due dates, or clear Planner filters.</div></div></section></template>
