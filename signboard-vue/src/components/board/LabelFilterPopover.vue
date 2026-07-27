<script setup lang="ts">
import AppPopover from '../../lib/components/AppPopover.vue'
import type { BoardLabel } from '../../types'

defineProps<{ isOpen: boolean; opener: HTMLElement | null; labels: BoardLabel[]; selectedIds: string[]; onClose: () => void; onToggleLabel: (id: string, enabled: boolean) => void; onClear: () => void }>()
</script>
<template>
  <AppPopover id="labelFilterPopover" :is-open="isOpen" :opener="opener" :on-close="onClose" aria-label="Filter cards" class-name="label-filter-popover">
    <div class="label-popover-labels" :class="{ 'label-popover-labels-scroll': labels.length >= 11 }">
      <p v-if="!labels.length" class="label-popover-empty">No labels yet. Add labels in Settings.</p>
      <label v-for="label in labels" :key="label.id" class="label-popover-row"><input type="checkbox" :checked="selectedIds.includes(label.id)" @change="onToggleLabel(label.id, ($event.target as HTMLInputElement).checked)"><span class="label-color-swatch" :style="{ backgroundColor: label.colorLight || '#3b82f6' }" /><span>{{ label.name }}</span></label>
    </div>
    <button class="label-popover-clear" type="button" :disabled="!selectedIds.length" @click="onClear">Clear filters</button>
  </AppPopover>
</template>
