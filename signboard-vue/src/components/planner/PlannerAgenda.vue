<script setup lang="ts">
import { computed } from 'vue'
import { buildPlannerAgenda } from '../../../lib/planner.js'
import { usePlannerStore } from '../../stores/usePlannerStore'
import PlannerTemporalCard from './PlannerTemporalCard.vue'

const props = defineProps<{ onOpen: (entry: any) => void }>()
const planner = usePlannerStore()
const placements = computed(() => buildPlannerAgenda(planner.entries, { searchQuery: planner.searchQuery, dateFilter: planner.dateFilter, showCompletedCards: planner.showCompletedCards, selectedLabelIds: planner.selectedLabelIds }))
const groups = computed(() => { const grouped = new Map<string, any[]>(); for (const placement of placements.value) { if (!grouped.has(placement.agendaDate)) grouped.set(placement.agendaDate, []); grouped.get(placement.agendaDate)?.push(placement) } return grouped })
function heading(date: string) { const today = new Date(); const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`; const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1); const tomorrowIso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`; const label = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00`)); return date === todayIso ? `Today · ${label}` : date === tomorrowIso ? `Tomorrow · ${label}` : date < todayIso ? `Overdue · ${label}` : label }
</script>

<template><section class="planner-view planner-agenda"><div class="planner-agenda-header"><h2>Agenda</h2></div><div class="planner-agenda-list"><section v-for="(entries, date) in Object.fromEntries(groups)" :key="date" class="planner-agenda-date-section" :class="{ 'is-overdue': date < new Date().toISOString().slice(0, 10) }"><h3>{{ heading(date) }}</h3><div class="planner-agenda-date-cards"><PlannerTemporalCard v-for="entry in entries" :key="`${entry.cardPath}-${entry.temporalReason}-${entry.agendaDate}`" :entry="entry" :iso-date="date" class-name="planner-list-card" :on-open="props.onOpen" /></div></section><div v-if="!placements.length" class="planner-empty-state">No dated cards match this agenda. Add card or task start/due dates, or clear Planner filters.</div></div></section></template>
