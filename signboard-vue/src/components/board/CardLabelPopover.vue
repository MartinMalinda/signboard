<script setup lang="ts">
import { ref } from 'vue'
import AppPopover from '../../lib/components/AppPopover.vue'
import FeatherIcon from '../FeatherIcon.vue'
import type { BoardLabel } from '../../types'
import { useLabelsStore } from '../../stores/useLabelsStore'
import { useSettingsStore } from '../../stores/useSettingsStore'

const props = defineProps<{ isOpen: boolean; opener: HTMLElement | null; cardPath: string; labels: BoardLabel[]; selectedIds: string[]; onClose: () => void; onChanged?: () => void }>()
const labelsStore = useLabelsStore(); const settings = useSettingsStore(); const newName = ref(''); const saving = ref(false)
async function toggle(id: string, event: Event) { const checked = (event.target as HTMLInputElement).checked; const next = checked ? [...props.selectedIds, id] : props.selectedIds.filter((value) => value !== id); await save(next) }
async function save(ids: string[]) { if (saving.value) return; saving.value = true; try { await labelsStore.updateCardLabels(props.cardPath, ids); props.onChanged?.() } finally { saving.value = false } }
async function create() { const label = await labelsStore.createLabel(newName.value); if (!label) return; newName.value = ''; await save([...props.selectedIds, label.id]); }
function openSettings() { props.onClose(); void settings.open('labels') }
</script>
<template>
  <template v-if="isOpen">
  <AppPopover id="cardLabelPopover" :is-open="isOpen" :opener="opener" :on-close="onClose" aria-label="Card labels" class-name="card-label-popover">
    <div class="card-label-popover-header"><span class="card-label-popover-title">Labels</span><button class="card-label-settings-shortcut" type="button" tabindex="-1" title="Open label settings" aria-label="Open label settings" @click="openSettings"><FeatherIcon name="settings" /></button></div>
    <p v-if="!labels.length" class="label-popover-empty">No labels yet.</p>
    <label v-for="label in labels" :key="label.id" class="label-popover-row"><input type="checkbox" :checked="selectedIds.includes(label.id)" @change="toggle(label.id, $event)"><span class="label-color-swatch" :style="{ backgroundColor: label.colorLight || '#3b82f6' }" /><span>{{ label.name }}</span></label>
    <p v-if="selectedIds.some((id) => !labels.some((label) => label.id === id))" class="label-popover-empty">Unknown label references are preserved.</p>
    <div class="label-popover-separator" aria-hidden="true" />
    <form class="card-label-create-form" @submit.prevent="create"><input class="card-label-create-input" type="text" placeholder="New label" aria-label="New label name" :value="newName" @input="newName = ($event.target as HTMLInputElement).value"><button class="card-label-create-button" type="submit">Add</button></form>
  </AppPopover>
  </template>
</template>
