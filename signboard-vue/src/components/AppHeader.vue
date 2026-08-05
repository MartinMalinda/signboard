<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useBoardsStore } from '../stores/useBoardsStore'
import FeatherIcon from './FeatherIcon.vue'
import BoardMenu from './BoardMenu.vue'
import { getShortcutAriaKeyshortcuts, getShortcutHintText } from '../../lib/shortcutLabels.js'
import LabelFilterPopover from './board/LabelFilterPopover.vue'
import { getActiveFilterCount } from '../../lib/cardFilters.js'
import { useLabelsStore } from '../stores/useLabelsStore'

const boards = useBoardsStore()
const props = defineProps<{ onQuickAdd?: () => void; onOpenSettings?: () => void; onOpenArchive?: () => void; onOpenSponsor?: () => void; onOpenBoardSwitcher?: () => void }>()
const labelsStore = useLabelsStore(); const filterOpener = ref<HTMLElement | null>(null); const filterOpen = ref(false)
const filterSummary = computed(() => { const count = getActiveFilterCount({ selectedLabelIds: labelsStore.filterIds }); if (!count) return ''; if (count === 1) return 'Filter: 1 label'; return `Filters: ${count} active` })
function openBoardSwitcherFromSearch(event: FocusEvent) { (event.currentTarget as HTMLInputElement).blur(); props.onOpenBoardSwitcher?.() }
function toggleFilter() { filterOpener.value = document.activeElement as HTMLElement; filterOpen.value = !filterOpen.value }
function closeFilter() { filterOpen.value = false; void nextTick(() => filterOpener.value?.focus()) }
function clearFilters() { labelsStore.resetFilters(); closeFilter() }
</script>

<template>
  <header class="app-header" :class="{ 'has-active-board': Boolean(boards.activeBoardPath) }">
    <div class="headerTopRow">
      <div class="headerControls">
        <div id="boardPathWrapper"><input id="boardPath" class="hidden" readonly :value="boards.activeBoardPath"></div>
        <div id="boardControls">
          <input id="boardSearchInput" type="search" placeholder="Search cards" aria-label="Search cards" aria-haspopup="dialog" readonly @focus="openBoardSwitcherFromSearch">
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
