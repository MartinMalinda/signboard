<script setup lang="ts">
import { ref } from 'vue'
import type { BoardLabel } from '../../types'
import FeatherIcon from '../FeatherIcon.vue'
import CardLabelPopover from './CardLabelPopover.vue'

defineProps<{ cardPath: string; labelIds: string[]; labels: BoardLabel[]; onChanged?: () => void }>()
const opener = ref<HTMLElement | null>(null); const isOpen = ref(false)
function toggle() { opener.value = document.activeElement as HTMLElement; isOpen.value = !isOpen.value }
function close() { isOpen.value = false; void opener.value?.focus() }
</script>
<template>
  <button ref="opener" class="metadata-action card-label-button" type="button" title="Set labels" aria-label="Set labels" @click.stop="toggle"><FeatherIcon name="tag" /></button>
  <div class="card-labels">
    <button v-for="id in labelIds" :key="id" class="card-label-chip" type="button" :class="{ 'card-label-chip-unknown': !labels.find((label) => label.id === id) }" :style="labels.find((label) => label.id === id) ? { backgroundColor: `${labels.find((label) => label.id === id)?.colorLight || '#94a3b8'}22`, borderColor: labels.find((label) => label.id === id)?.colorLight || '#94a3b8' } : undefined" @click.stop="toggle">{{ labels.find((label) => label.id === id)?.name || 'Unknown label' }}</button>
  </div>
  <CardLabelPopover :is-open="isOpen" :opener="opener" :card-path="cardPath" :labels="labels" :selected-ids="labelIds" :on-close="close" :on-changed="onChanged" />
</template>

<style scoped>
.card-label-button { flex: 0 0 auto; }
.card-label-chip { padding: 1px 8px; border-radius: 999px; box-shadow: none; }
</style>
