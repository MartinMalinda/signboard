<script setup lang="ts">
import AppPopover from '../../lib/components/AppPopover.vue'
import FeatherIcon from '../FeatherIcon.vue'
import type { BoardLabel } from '../../types'
import { DATE_FILTERS, DATE_FILTER_LABELS } from '../../../lib/cardFilters.js'

defineProps<{ isOpen: boolean; opener: HTMLElement | null; labels: BoardLabel[]; selectedIds: string[]; dateFilter: string; onClose: () => void; onToggleLabel: (id: string, enabled: boolean) => void; onDateFilter: (value: string) => void; onClear: () => void }>()
const dateRows = [DATE_FILTERS.today, DATE_FILTERS.overdue, DATE_FILTERS.next7, DATE_FILTERS.next14, DATE_FILTERS.next30]
</script>
<template>
  <AppPopover id="labelFilterPopover" :is-open="isOpen" :opener="opener" :on-close="onClose" aria-label="Filter cards" class-name="label-filter-popover">
    <label v-for="date in dateRows" :key="date" class="label-popover-row"><input type="checkbox" :checked="dateFilter === date" @change="onDateFilter(date)"><FeatherIcon :name="date === DATE_FILTERS.today ? 'sun' : date === DATE_FILTERS.overdue ? 'alert-circle' : 'calendar'" /><span>{{ DATE_FILTER_LABELS[date] }}</span></label>
    <div class="label-popover-separator" aria-hidden="true" />
    <div class="label-popover-labels" :class="{ 'label-popover-labels-scroll': labels.length >= 11 }">
      <p v-if="!labels.length" class="label-popover-empty">No labels yet. Add labels in Settings.</p>
      <label v-for="label in labels" :key="label.id" class="label-popover-row"><input type="checkbox" :checked="selectedIds.includes(label.id)" @change="onToggleLabel(label.id, ($event.target as HTMLInputElement).checked)"><span class="label-color-swatch" :style="{ backgroundColor: label.colorLight || '#3b82f6' }" /><span>{{ label.name }}</span></label>
    </div>
    <button class="label-popover-clear" type="button" :disabled="!selectedIds.length && !dateFilter" @click="onClear">Clear filters</button>
  </AppPopover>
</template>
