<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useBoardsStore } from '../stores/useBoardsStore'
import FeatherIcon from './FeatherIcon.vue'
import BoardMenu from './BoardMenu.vue'
import { getShortcutAriaKeyshortcuts, getShortcutHintText } from '../../lib/shortcutLabels.js'
import LabelFilterPopover from './board/LabelFilterPopover.vue'
import { getActiveFilterCount } from '../../lib/cardFilters.js'
import { useLabelsStore } from '../stores/useLabelsStore'
import { useSearchStore } from '../stores/useSearchStore'

const boards = useBoardsStore()
const props = defineProps<{ onQuickAdd?: () => void; onOpenSettings?: () => void; onOpenArchive?: () => void; onOpenSponsor?: () => void }>()
const labelsStore = useLabelsStore(); const search = useSearchStore(); const filterOpener = ref<HTMLElement | null>(null); const filterOpen = ref(false)
const filterSummary = computed(() => { const count = getActiveFilterCount({ selectedLabelIds: labelsStore.filterIds }); if (!count) return ''; if (count === 1) return 'Filter: 1 label'; return `Filters: ${count} active` })
const resultButtons = () => Array.from(document.querySelectorAll<HTMLButtonElement>('.card:not(.card-filtered-out) .card-title-button')).filter((button) => !button.disabled)
function focusResult(index: number) { const buttons = resultButtons(); if (!buttons.length) return; const safe = ((index % buttons.length) + buttons.length) % buttons.length; search.setResultIndex(safe); buttons[safe]?.focus(); buttons[safe]?.scrollIntoView({ block: 'nearest', inline: 'nearest' }) }
function searchKeydown(event: KeyboardEvent) { if (event.key === 'Escape' && (search.inputQuery || search.isActive)) { event.preventDefault(); search.reset(); return } if (event.key === 'Enter' || event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); search.flush(); const index = search.moveResult(event.key === 'ArrowUp' ? -1 : 1, resultButtons().length); if (index >= 0) focusResult(index) } }
function resultKeydown(event: KeyboardEvent) { const target = event.target as HTMLElement; if (!target.classList.contains('card-title-button')) return; if (event.key === 'Escape') { event.preventDefault(); document.getElementById('boardSearchInput')?.focus(); return } if (event.key === 'Home' || event.key === 'End' || event.key === 'ArrowDown' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowLeft') { event.preventDefault(); const buttons = resultButtons(); const index = buttons.indexOf(target as HTMLButtonElement); focusResult(event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : index + (event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 1)) } }
function toggleFilter() { filterOpener.value = document.activeElement as HTMLElement; filterOpen.value = !filterOpen.value }
function closeFilter() { filterOpen.value = false; void nextTick(() => filterOpener.value?.focus()) }
function clearFilters() { labelsStore.resetFilters(); closeFilter() }
onMounted(() => document.addEventListener('keydown', resultKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', resultKeydown))
</script>

<template>
  <header class="app-header" :class="{ 'has-active-board': Boolean(boards.activeBoardPath) }">
    <div class="headerTopRow">
      <div class="headerControls">
        <div id="boardPathWrapper"><input id="boardPath" class="hidden" readonly :value="boards.activeBoardPath"></div>
        <div id="boardControls">
          <input id="boardSearchInput" type="search" placeholder="Search cards" aria-label="Search cards" :value="search.inputQuery" @input="search.setQuery(($event.target as HTMLInputElement).value)" @keydown="searchKeydown">
          <div v-if="filterSummary" id="activeBoardFilterSummary" class="active-filter-summary"><span>{{ filterSummary }}</span><button id="clearActiveBoardFilters" type="button" aria-label="Clear active filters" title="Clear active filters" @click="clearFilters">×</button></div>
          <button id="quickAddHeaderButton" type="button" title="Quick add card" aria-label="Quick add card" :aria-keyshortcuts="getShortcutAriaKeyshortcuts('addCard')" @click="props.onQuickAdd?.()">
            <FeatherIcon name="plus" /><span>Card</span>
            <span class="menu-shortcut-hint">{{ getShortcutHintText('addCard') }}</span>
          </button>
          <div class="board-toolbar-group">
            <button id="labelFilterButton" type="button" title="Filter cards" :aria-label="filterSummary ? `Filter cards: ${filterSummary.replace(/^Filter: |^Filters: /, '')}` : 'Filter cards'" :aria-expanded="filterOpen" :data-active-filters="getActiveFilterCount({ selectedLabelIds: labelsStore.filterIds })" :class="{ 'is-active': Boolean(filterSummary) }" @click="toggleFilter"><FeatherIcon name="filter" /></button>
            <LabelFilterPopover :is-open="filterOpen" :opener="filterOpener" :labels="labelsStore.labels" :selected-ids="labelsStore.filterIds" :on-close="closeFilter" :on-toggle-label="labelsStore.toggleFilterLabel" :on-clear="clearFilters" />
          </div>
          <BoardMenu :on-open-settings="props.onOpenSettings" :on-open-archive="props.onOpenArchive" :on-open-sponsor="props.onOpenSponsor" />
        </div>
      </div>
    </div>
    <div id="boardTabsWrapper" :class="{ hidden: boards.openBoardPaths.length === 0 }">
      <slot />
    </div>
  </header>
</template>

<style scoped>
.active-filter-summary {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 180px;
  padding: 4px 6px 4px 9px;
  border: 1px solid color-mix(in oklab, var(--accent) 30%, var(--border));
  border-radius: 999px;
  background: color-mix(in oklab, var(--accent) 8%, var(--bg-card));
  color: var(--text);
  font-size: var(--font-xs);
  white-space: nowrap;
}
.active-filter-summary span { overflow: hidden; text-overflow: ellipsis; }
.active-filter-summary button { padding: 0 3px; border: 0; background: transparent; box-shadow: none; color: var(--muted); }
</style>
