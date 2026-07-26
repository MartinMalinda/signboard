<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import AppPopover from '../../lib/components/AppPopover.vue'
import FeatherIcon from '../FeatherIcon.vue'
import { getShortcutAriaKeyshortcuts, getShortcutHintText } from '../../../lib/shortcutLabels.js'
import { PLANNER_DATE_FILTER_OPTIONS, PLANNER_VIEW_IDS } from '../../../lib/planner.js'
import { usePlannerStore, type PlannerView } from '../../stores/usePlannerStore'

const props = defineProps<{ onClose: () => void }>()
const planner = usePlannerStore()
const filterOpener = ref<HTMLElement | null>(null)
const filterOpen = ref(false)
const activeFilterCount = computed(() => Number(Boolean(planner.dateFilter)) + Number(planner.showCompletedCards) + Number(planner.scope !== 'all') + planner.selectedLabelIds.length)
const scopeLabel = computed(() => planner.scope === 'all' ? `${planner.openBoardRoots.length} board${planner.openBoardRoots.length === 1 ? '' : 's'}` : planner.scope === 'current' ? planner.currentBoardName : `${planner.selectedRoots.length}/${planner.openBoardRoots.length} boards`)
const viewTabs: Array<{ id: PlannerView; label: string; shortcut: string }> = [
  { id: PLANNER_VIEW_IDS.calendar as PlannerView, label: 'Calendar', shortcut: 'calendarView' },
  { id: PLANNER_VIEW_IDS.thisWeek as PlannerView, label: 'This Week', shortcut: 'thisWeekView' },
  { id: PLANNER_VIEW_IDS.day as PlannerView, label: 'Day', shortcut: 'plannerDayView' },
  { id: PLANNER_VIEW_IDS.agenda as PlannerView, label: 'Agenda', shortcut: 'plannerAgendaView' },
]

function toggleFilter() { filterOpener.value = document.activeElement as HTMLElement; filterOpen.value = !filterOpen.value }
function closeFilter() { filterOpen.value = false; void nextTick(() => filterOpener.value?.focus()) }
function setView(next: PlannerView) { planner.setView(next) }
function setSearch(event: Event) { planner.setSearchQuery((event.target as HTMLInputElement).value) }
function searchKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && planner.searchQuery) { event.preventDefault(); planner.setSearchQuery(''); return }
  if (['Enter', 'ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.planner-calendar-card, .planner-this-week-card, .planner-list-card')); const index = buttons.indexOf(document.activeElement as HTMLButtonElement); const next = event.key === 'ArrowUp' ? (index <= 0 ? buttons.length - 1 : index - 1) : (index < 0 ? 0 : (index + 1) % buttons.length); buttons[next]?.focus() }
}
</script>

<template>
  <div class="planner-header">
    <div class="planner-header-left">
      <h2 id="plannerTitle">Planner</h2>
      <div id="plannerViewTabs" class="planner-view-tabs" role="group" aria-label="Planner views">
        <button v-for="tab in viewTabs" :key="tab.id" class="planner-view-tab" :class="{ 'is-active': planner.activeView === tab.id }" type="button" :data-view-id="tab.id" :aria-pressed="planner.activeView === tab.id ? 'true' : 'false'" :aria-label="tab.label" :title="`${tab.label} (${getShortcutHintText(tab.shortcut)})`" :aria-keyshortcuts="getShortcutAriaKeyshortcuts(tab.shortcut)" @click="setView(tab.id)"><FeatherIcon :name="tab.id === 'calendar' ? 'calendar' : tab.id === 'this-week' ? 'clock' : tab.id === 'day' ? 'sun' : 'list'" :size="15" /><span class="planner-view-tab-label">{{ tab.label }}</span></button>
      </div>
      <div id="plannerScopeToggle" class="planner-scope-toggle" role="group" aria-label="Planner board scope">
        <button v-for="scopeOption in [{ id: 'all', label: 'All Boards', icon: 'layers' }, { id: 'current', label: 'Current Board', icon: 'columns' }]" :key="scopeOption.id" class="planner-scope-option" :class="{ 'is-active': planner.scope === scopeOption.id }" type="button" :data-scope="scopeOption.id" :aria-pressed="planner.scope === scopeOption.id ? 'true' : 'false'" :disabled="scopeOption.id === 'current' && !planner.activeBoardRoot" :aria-label="scopeOption.label" @click="planner.setScope(scopeOption.id as 'all' | 'current')"><FeatherIcon :name="scopeOption.icon" :size="14" /><span class="planner-scope-option-label">{{ scopeOption.label }}</span></button>
      </div>
      <span id="plannerScopeLabel" class="planner-scope-label" aria-live="polite">{{ scopeLabel }}</span>
    </div>
    <div class="planner-header-controls">
      <input id="plannerSearchInput" type="search" placeholder="Search planner" aria-label="Search planner" :value="planner.searchQuery" @input="setSearch" @keydown="searchKeydown">
      <div class="planner-toolbar-group"><button id="plannerFilterButton" type="button" title="Planner filters" :aria-label="activeFilterCount ? `Planner filters: ${activeFilterCount} active` : 'Planner filters'" :aria-expanded="filterOpen ? 'true' : 'false'" :data-active-filters="activeFilterCount" :class="{ 'is-active': activeFilterCount > 0 }" @click="toggleFilter"><FeatherIcon name="filter" /></button><AppPopover id="plannerFilterPopover" :is-open="filterOpen" :opener="filterOpener" aria-label="Planner filters" class-name="planner-filter-popover" :on-close="closeFilter">
        <section class="planner-filter-section"><h3>Date</h3><button v-for="option in PLANNER_DATE_FILTER_OPTIONS" :key="option.value" class="planner-filter-row" type="button" :aria-pressed="planner.dateFilter === option.value ? 'true' : 'false'" @click="planner.setDateFilter(option.value)"><span class="planner-filter-check" aria-hidden="true">{{ planner.dateFilter === option.value ? '✓' : '' }}</span><span>{{ option.label }}</span></button></section>
        <section class="planner-filter-section"><h3>Completed cards</h3><button class="planner-filter-row" type="button" :aria-pressed="!planner.showCompletedCards ? 'true' : 'false'" @click="planner.setShowCompletedCards(false)"><span class="planner-filter-check" aria-hidden="true">{{ !planner.showCompletedCards ? '✓' : '' }}</span><span>Hide completed cards</span></button><button class="planner-filter-row" type="button" :aria-pressed="planner.showCompletedCards ? 'true' : 'false'" @click="planner.setShowCompletedCards(true)"><span class="planner-filter-check" aria-hidden="true">{{ planner.showCompletedCards ? '✓' : '' }}</span><span>Show completed cards</span></button></section>
        <section class="planner-filter-section"><h3>Boards</h3><label v-for="root in planner.openBoardRoots" :key="root" class="planner-filter-checkbox-row"><input type="checkbox" :checked="planner.selectedRoots.includes(root)" @change="planner.setBoardSelected(root, ($event.target as HTMLInputElement).checked)"><span>{{ root.replace(/\/+$/, '').split('/').filter(Boolean).pop() }}</span></label></section>
        <section v-if="planner.canUseLabelFilters" class="planner-filter-section"><h3>Labels</h3><label v-for="label in planner.currentBoardLabels" :key="label.id" class="planner-filter-checkbox-row"><input type="checkbox" :checked="planner.selectedLabelIds.includes(label.id)" @change="planner.setLabelSelected(label.id, ($event.target as HTMLInputElement).checked)"><span>{{ label.name }}</span></label></section>
        <button class="planner-filter-clear" type="button" @click="planner.clearFilters(); closeFilter()">Clear filters</button>
      </AppPopover></div>
      <button id="plannerCloseButton" class="planner-close-button" type="button" title="Close Planner" aria-label="Close Planner" :aria-keyshortcuts="getShortcutAriaKeyshortcuts('plannerToggle')" @click="props.onClose"><FeatherIcon name="x" /></button>
    </div>
  </div>
</template>
