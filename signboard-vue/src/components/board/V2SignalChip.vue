<script setup lang="ts">
import FeatherIcon from '../FeatherIcon.vue'

withDefaults(defineProps<{
  label: string
  icon?: string
  tone?: string
  density?: 'compact' | 'standard'
}>(), {
  icon: '',
  tone: 'kind',
  density: 'compact',
})
</script>

<template>
  <span class="card-v2-signal" :class="[`card-v2-signal-${tone}`, `card-v2-signal-${density}`]">
    <FeatherIcon v-if="icon" :name="icon" :size="density === 'standard' ? 13 : 12" />
    <span>{{ label }}</span>
  </span>
</template>

<style scoped>
.card-v2-signal { display: inline-flex; align-items: center; gap: 3px; min-height: 19px; padding: 1px 6px; border: 1px solid var(--border, #e6e8ec); border-radius: 999px; color: var(--muted, #6b7280); font-size: 10px; line-height: 1.2; white-space: nowrap; }
.card-v2-signal-standard { min-height: 21px; font-size: 11px; }
.card-v2-signal-kind { color: var(--text, #111827); }
.card-v2-signal-priority { border-color: color-mix(in srgb, var(--primary, #0b5fff) 45%, var(--border, #e6e8ec)); color: var(--primary, #0b5fff); font-weight: 700; }
.card-v2-signal-derived { border-color: color-mix(in srgb, #f59e0b 45%, var(--border, #e6e8ec)); color: #a16207; }
</style>
