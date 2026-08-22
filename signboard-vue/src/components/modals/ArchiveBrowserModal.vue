<script setup lang="ts">
import { nextTick, onUpdated, ref } from 'vue'
import Modal from '../../lib/components/Modal.vue'
import FeatherIcon from '../FeatherIcon.vue'
import { useArchiveStore } from '../../stores/useArchiveStore'
import type { ArchiveEntry } from '../../types'
import { getCardDisplayTitle } from '../../../lib/cardTitle.js'

const archive = useArchiveStore()
const restoreSearch = ref<HTMLInputElement | null>(null)

const cardSortOptions = [
  { value: 'archived-desc', label: 'Archived date, newest first' },
  { value: 'archived-asc', label: 'Archived date, oldest first' },
  { value: 'title-asc', label: 'Title, A-Z' },
]
const listSortOptions = [
  { value: 'archived-desc', label: 'Archived date, newest first' },
  { value: 'archived-asc', label: 'Archived date, oldest first' },
  { value: 'name-asc', label: 'Name, A-Z' },
]

function formatDate(value: string | undefined) {
  const date = new Date(String(value || ''))
  return Number.isNaN(date.getTime()) ? 'Unknown date' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date)
}
function title(entry: ArchiveEntry) { return entry.kind === 'list' ? entry.listDisplayName || entry.listDirectoryName || 'Untitled list' : entry.title || getCardDisplayTitle('', entry.archivedCardFile || entry.entryPath) }
function select(entry: ArchiveEntry) { archive.select(entry.entryPath) }
function resultKeydown(event: KeyboardEvent, index: number) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') { event.preventDefault(); focusResult(index + 1) }
  else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') { event.preventDefault(); focusResult(index - 1) }
  else if (event.key === 'Home') { event.preventDefault(); focusResult(0) }
  else if (event.key === 'End') { event.preventDefault(); focusResult(archive.filteredEntries.length - 1) }
  else if (event.key === 'Escape') { event.preventDefault(); document.getElementById('archiveBrowserSearchInput')?.focus() }
}
function focusResult(index: number) {
  const rows = Array.from(document.querySelectorAll<HTMLButtonElement>('#archiveBrowserResults .archive-browser-row'))
  if (!rows.length) return
  const safe = (index + rows.length) % rows.length
  rows[safe]?.focus()
  const entry = archive.filteredEntries[safe]
  if (entry) archive.select(entry.entryPath)
}
function searchKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === 'ArrowDown') { event.preventDefault(); focusResult(0) }
  else if (event.key === 'ArrowUp') { event.preventDefault(); focusResult(archive.filteredEntries.length - 1) }
  else if (event.key === 'Escape' && archive.searchQuery) { event.preventDefault(); archive.setSearch('') }
}
function selectRestoreList(path: string) { archive.restoreSelectedListPath = path }
function restoreList() {
  const entry = archive.selectedDetail || archive.selectedEntry
  if (entry) void archive.restoreList(entry)
}
onUpdated(() => { if (archive.restoreOpen && document.activeElement !== restoreSearch.value) void nextTick(() => restoreSearch.value?.focus()) })
</script>

<template>
  <Modal id="modalArchiveBrowser" modal-class="archive-browser-modal" positioning="fixed" :show-chrome="false" labelled-by="archiveBrowserTitle" :is-open="archive.isOpen" :on-close="archive.close" initial-focus="#archiveBrowserSearchInput">
    <div class="archive-browser-header">
      <div><h2 id="archiveBrowserTitle">Restore from archive</h2></div>
      <button id="archiveBrowserClose" class="commercial-license-close" type="button" title="Close archive browser" aria-label="Close archive browser" @click="archive.close()"><FeatherIcon name="x" /></button>
    </div>
    <div class="archive-browser-controls">
      <div class="archive-browser-toolbar">
        <div class="archive-browser-tabs" role="tablist" aria-label="Archive types">
          <button id="archiveBrowserTabCards" class="archive-browser-tab" :class="{ 'is-active': archive.activeTab === 'cards' }" type="button" role="tab" :aria-selected="archive.activeTab === 'cards'" @click="archive.setTab('cards')">Cards</button>
          <button id="archiveBrowserTabLists" class="archive-browser-tab" :class="{ 'is-active': archive.activeTab === 'lists' }" type="button" role="tab" :aria-selected="archive.activeTab === 'lists'" @click="archive.setTab('lists')">Lists</button>
        </div>
        <input id="archiveBrowserSearchInput" type="search" :placeholder="archive.activeTab === 'lists' ? 'Search archived lists' : 'Search archived cards'" aria-label="Search archive" :value="archive.searchQuery" @input="archive.setSearch(($event.target as HTMLInputElement).value)" @keydown="searchKeydown">
        <select id="archiveBrowserSortSelect" aria-label="Sort archive results" :value="archive.sortKey" @change="archive.setSort(($event.target as HTMLSelectElement).value)"><option v-for="option in (archive.activeTab === 'lists' ? listSortOptions : cardSortOptions)" :key="option.value" :value="option.value">{{ option.label }}</option></select>
        <span id="archiveBrowserResultCount" class="archive-browser-result-count" aria-live="polite">{{ archive.filteredEntries.length }}{{ archive.filteredEntries.length !== archive.activeEntries.length ? ` of ${archive.activeEntries.length}` : '' }} {{ archive.activeTab }}</span>
      </div>
    </div>
    <div class="archive-browser-body">
      <div id="archiveBrowserResults" class="archive-browser-results" aria-label="Archived items">
        <div v-if="archive.loading" class="archive-browser-empty-state">Loading archive...</div>
        <div v-else-if="archive.error" class="archive-browser-empty-state archive-browser-empty-state-error">{{ archive.error }}</div>
        <div v-else-if="!archive.filteredEntries.length" class="archive-browser-empty-state">{{ archive.activeEntries.length ? 'No archived items match your search.' : 'Archive is empty.' }}</div>
        <button v-for="(entry, index) in archive.filteredEntries" v-else :key="entry.entryPath" class="archive-browser-row" :class="{ 'is-active': entry.entryPath === archive.selectedEntryPath }" type="button" :data-entry-path="entry.entryPath" :aria-pressed="entry.entryPath === archive.selectedEntryPath" @click="select(entry)" @keydown="resultKeydown($event, index)">
          <div class="archive-browser-row-header"><div class="archive-browser-row-title-wrap"><strong class="archive-browser-row-title">{{ title(entry) }}</strong><span v-if="entry.kind === 'card' && entry.insideArchivedList" class="archive-browser-badge archive-browser-badge-emphasis">In archived list</span><span v-if="entry.kind === 'list'" class="archive-browser-badge archive-browser-badge-muted">{{ entry.cardCount || 0 }} card{{ entry.cardCount === 1 ? '' : 's' }}</span></div><span class="archive-browser-row-date">{{ formatDate(entry.archivedAt) }}</span></div>
          <div v-if="entry.kind === 'card' && (entry.due || entry.labelNames?.length)" class="archive-browser-row-badges"><span v-if="entry.due" class="archive-browser-badge archive-browser-badge-due">Due {{ entry.due }}</span><span v-for="label in (entry.labelNames || []).slice(0, 3)" :key="label" class="archive-browser-label-chip">{{ label }}</span></div>
          <p v-if="entry.kind === 'card' && entry.previewText" class="archive-browser-row-preview">{{ entry.previewText }}</p>
        </button>
      </div>
      <aside id="archiveBrowserDetail" class="archive-browser-detail" aria-live="polite">
        <div v-if="archive.detailLoadingPath" class="archive-browser-detail-empty">Loading preview...</div>
        <div v-else-if="archive.detailError" class="archive-browser-detail-empty archive-browser-empty-state-error">{{ archive.detailError }}</div>
        <div v-else-if="!archive.selectedEntry" class="archive-browser-detail-empty">Select an archived card or list to preview it.</div>
        <template v-else-if="archive.selectedDetail">
          <div class="archive-browser-detail-header"><div class="archive-browser-detail-title-wrap"><h2 class="archive-browser-detail-title">{{ title(archive.selectedDetail) }}</h2><p class="archive-browser-detail-meta">Archived {{ formatDate(archive.selectedDetail.archivedAt) }} • Original list: {{ archive.selectedDetail.originalListDisplayName || 'Unknown original list' }}</p></div><button class="archive-browser-restore-button" type="button" @click="archive.selectedDetail.kind === 'card' ? archive.openRestoreCard(archive.selectedDetail) : restoreList()">{{ archive.selectedDetail.kind === 'list' ? 'Restore list' : 'Restore card' }}</button></div>
          <div v-if="archive.selectedDetail.kind === 'card'" class="archive-browser-detail-badges"><span v-if="archive.selectedDetail.due" class="archive-browser-badge archive-browser-badge-due">Due {{ archive.selectedDetail.due }}</span><span v-if="archive.selectedDetail.insideArchivedList" class="archive-browser-badge archive-browser-badge-emphasis">Stored inside archived list</span><span v-for="label in (archive.selectedDetail.labelNames || [])" :key="label" class="archive-browser-label-chip">{{ label }}</span></div>
          <pre v-if="archive.selectedDetail.kind === 'card'" class="archive-browser-detail-preview">{{ archive.selectedDetail.card?.body || 'No notes on this card.' }}</pre>
          <div v-else class="archive-browser-detail-list-preview"><h3 class="archive-browser-detail-subtitle">Cards in this archived list</h3><ul v-if="archive.selectedDetail.cards?.length" class="archive-browser-detail-card-list"><li v-for="card in archive.selectedDetail.cards.slice(0, 40)" :key="String(card.title)" class="archive-browser-detail-card-list-item">{{ card.title || 'Untitled' }}</li></ul><p v-else class="archive-browser-detail-more">This archived list is empty.</p></div>
        </template>
      </aside>
    </div>
    <div v-if="archive.restoreOpen" id="archiveRestoreDialog" class="archive-restore-dialog" role="dialog" aria-modal="true" aria-labelledby="archiveRestoreTitle" aria-hidden="false" @keydown.esc.stop.prevent="archive.closeRestore()">
      <div class="archive-restore-dialog-card"><h3 id="archiveRestoreTitle">Restore card</h3><p id="archiveRestoreOriginalList" class="archive-restore-subtitle">Original list: {{ archive.restoreEntry?.originalListDisplayName || 'Unknown original list' }}</p><input ref="restoreSearch" id="archiveRestoreSearchInput" type="search" placeholder="Search lists" aria-label="Search destination lists" :value="archive.restoreQuery" @input="archive.restoreQuery = ($event.target as HTMLInputElement).value"><div id="archiveRestoreListOptions" class="archive-restore-options"><button v-for="list in archive.visibleRestoreLists" :key="list.path" class="archive-restore-option" :class="{ 'is-active': list.path === archive.restoreSelectedListPath }" type="button" @click="selectRestoreList(list.path)">{{ list.displayName }}</button><div v-if="!archive.visibleRestoreLists.length" class="archive-restore-empty">No lists match that search.</div></div><p id="archiveRestoreError" class="archive-restore-error" aria-live="polite">{{ archive.restoreError }}</p><div class="archive-restore-actions"><button id="archiveRestoreCancel" type="button" @click="archive.closeRestore()">Cancel</button><button id="archiveRestoreConfirm" type="button" :disabled="!archive.restoreSelectedListPath || archive.restoreSaving" @click="void archive.confirmRestoreCard()">{{ archive.restoreSaving ? 'Restoring...' : 'Restore card' }}</button></div></div>
    </div>
  </Modal>
</template>
