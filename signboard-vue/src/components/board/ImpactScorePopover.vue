<script setup lang="ts">
import { computed, ref } from 'vue'
import AppPopover from '../../lib/components/AppPopover.vue'
import { formatImpactScore } from '../../../lib/impactScore'
import V2SignalChip from './V2SignalChip.vue'
import type { BoardV2Snapshot } from '../../types'

type ImpactCard = BoardV2Snapshot['cards'][number]

const props = defineProps<{ card: ImpactCard; score: number }>()
const open = ref(false)
const trigger = ref<HTMLElement | null>(null)

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function numericValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function formatScore(value: unknown) {
  return numericValue(value).toFixed(1)
}

const scores = computed(() => objectValue(props.card.scores))
const explanation = computed(() => objectValue(props.card.explanations?.impact_index))
const confidenceMultiplier = computed(() => numericValue(explanation.value.confidence_multiplier))
const effortPoints = computed(() => numericValue(explanation.value.effort_points))
const effortFactor = computed(() => numericValue(explanation.value.effort_factor))
const finalScore = computed(() => {
  const impactIndex = scores.value.impact_index
  return typeof impactIndex === 'number' && Number.isFinite(impactIndex) ? impactIndex : props.score
})
const formattedFinalScore = computed(() => formatImpactScore(finalScore.value))
const popoverId = computed(() => `impactScoreBreakdownPopover-${props.card.cardPath.replace(/[^a-zA-Z0-9_-]/g, '-')}`)

const valueSources = computed<Array<[string, unknown]>>(() => [
  ['Opportunity', scores.value.opportunity],
  ['Discovery', scores.value.discovery],
])

function close() {
  open.value = false
}

function toggle(event: Event) {
  event.stopPropagation()
  open.value = !open.value
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    event.stopPropagation()
    open.value = !open.value
  }
}
</script>

<template>
  <span
    ref="trigger"
    class="impact-score-trigger"
    role="button"
    tabindex="0"
    aria-haspopup="dialog"
    :aria-expanded="open"
    :aria-label="`Impact score ${formattedFinalScore}, show score breakdown`"
    @click.stop="toggle"
    @keydown="onKeydown"
  >
    <V2SignalChip class="dashboard-card-signal dashboard-card-signal-rank" :label="formattedFinalScore" icon="bar-chart-2" tone="rank" />
  </span>
  <AppPopover
    :id="popoverId"
    class-name="impact-score-popover"
    :is-open="open"
    :opener="trigger"
    :on-close="close"
    role="dialog"
    aria-label="Impact score breakdown"
  >
    <div class="impact-score-breakdown">
      <header class="impact-score-breakdown-header">
        <span class="impact-score-breakdown-eyebrow">Impact score</span>
        <strong>{{ formattedFinalScore }}</strong>
      </header>

      <section class="impact-score-breakdown-section" aria-labelledby="impactScoreValueTitle">
        <h3 id="impactScoreValueTitle">Positive value</h3>
        <div class="impact-score-total"><span>Total</span><strong>{{ formatScore(explanation.positive_impact) }}</strong></div>
        <div class="impact-score-source-list">
          <div v-for="[label, value] in valueSources" :key="label" class="impact-score-row"><span>{{ label }}</span><strong>{{ formatScore(value) }}</strong></div>
        </div>
      </section>

      <section class="impact-score-breakdown-section" aria-labelledby="impactScoreAdjustmentTitle">
        <h3 id="impactScoreAdjustmentTitle">Adjustments</h3>
        <div class="impact-score-row"><span>Confidence</span><strong>×{{ confidenceMultiplier.toFixed(2) }}</strong></div>
        <div class="impact-score-row"><span>Effort factor</span><strong>÷{{ effortFactor.toFixed(2) }} <small>({{ effortPoints }} pts)</small></strong></div>
      </section>

      <div class="impact-score-formula" aria-label="Impact score formula">
        {{ formatScore(explanation.positive_impact) }} × {{ confidenceMultiplier.toFixed(2) }} ÷ {{ effortFactor.toFixed(2) }}
      </div>
    </div>
  </AppPopover>
</template>

<style scoped>
:global(.impact-score-popover) { width: min(300px, calc(100vw - 16px)); min-width: 260px; padding: 0; overflow: hidden; }
.impact-score-breakdown { display: grid; gap: 12px; padding: 12px; color: var(--text, #0f172a); }
.impact-score-breakdown-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--border, #e6e8ec); }
.impact-score-breakdown-header strong { font-size: 20px; line-height: 1; }
.impact-score-breakdown-eyebrow { color: var(--muted, #6b7280); font-size: 12px; font-weight: 650; }
.impact-score-breakdown-section { display: grid; gap: 5px; }
.impact-score-breakdown-section h3 { margin: 0 0 2px; color: var(--muted, #6b7280); font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
.impact-score-total, .impact-score-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; font-size: 12px; }
.impact-score-total { padding-bottom: 5px; border-bottom: 1px solid var(--border, #e6e8ec); font-weight: 700; }
.impact-score-source-list { display: grid; gap: 3px; padding-left: 8px; }
.impact-score-source-list .impact-score-row { color: var(--muted, #6b7280); font-size: 11px; }
.impact-score-row strong, .impact-score-total strong { font-variant-numeric: tabular-nums; }
.impact-score-row small { color: var(--muted, #6b7280); font-size: 10px; font-weight: 400; }
.impact-score-formula { padding: 7px 8px; border-radius: 6px; background: color-mix(in srgb, var(--primary, #0b5fff) 8%, transparent); color: var(--text, #0f172a); font-family: var(--font-mono, monospace); font-size: 11px; font-variant-numeric: tabular-nums; text-align: center; }
.impact-score-trigger { display: inline-flex; max-width: 100%; cursor: pointer; outline: none; }
.impact-score-trigger:focus-visible { border-radius: 999px; box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary, #0b5fff) 28%, transparent); }
</style>
