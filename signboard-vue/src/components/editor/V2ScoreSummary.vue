<script setup lang="ts">
import { computed } from 'vue'
import { useBoardDataStore } from '../../stores/useBoardDataStore'
import { useEditorStore } from '../../stores/useEditorStore'

const props = defineProps<{ onOpenDetails?: () => void }>()

const editor = useEditorStore()
const data = useBoardDataStore()

const RANKING_SCORE_DEFINITIONS = [
  { key: 'priority_index', label: 'Priority', description: 'Relative ranking score used by the Priority section.', display: 'percentile' },
  { key: 'impact_index', label: 'Impact', description: 'Positive impact adjusted for confidence and effort.', display: 'percentile' },
  { key: 'risk_reduction_index', displayKey: 'risk_reduction', label: 'Risk reduction', description: 'Absolute amount of existing risk addressed by the work.', display: 'absolute' },
] as const

const projection = computed(() => data.snapshot?.v2?.cards.find((card) => card.cardPath === editor.cardPath))

function projectedScore(key: string) {
  const value = projection.value?.scores?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function projectedScoreRange(key: string) {
  const range = projection.value?.score_ranges?.[key]
  return range && Number.isFinite(range.min) && Number.isFinite(range.max) && range.max > range.min ? range : null
}

function formatProjectedScore(value: number | null) {
  return value === null ? '—' : value.toFixed(1)
}

function formatScorePercentage(value: number | null) {
  return value === null ? '—' : `${value.toFixed(1)}%`
}

function scoreTone(value: number | null, allowNegative = true) {
  if (value === null || (value > 25 && value < 75)) return 'is-neutral'
  if (!allowNegative) return value > 75 ? 'is-positive' : 'is-neutral'
  return value <= 25 ? 'is-negative' : 'is-positive'
}

function scoreTintOpacity(value: number | null, allowNegative = true) {
  if (value === null || (value > 25 && value < 75)) return '0.04'
  if (!allowNegative && value <= 75) return '0.04'
  const distanceFromQuartile = value <= 25 ? (25 - value) / 25 : (value - 75) / 25
  return (0.01 + 0.09 * Math.min(1, distanceFromQuartile)).toFixed(3)
}

function formatPercentile(value: number | null) {
  if (value === null) return '—'
  const rounded = Math.round(value)
  const lastTwoDigits = rounded % 100
  const suffix = lastTwoDigits >= 11 && lastTwoDigits <= 13
    ? 'th'
    : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[rounded % 10] || 'th'
  return `${rounded}${suffix}`
}

function formatPercentilePercentage(value: number | null) {
  return value === null ? '—' : `${Math.round(value)}%`
}

function boardPercentile(key: string, value: number | null) {
  if (value === null) return { percentile: null, populationSize: 0 }
  const population = (data.snapshot?.v2?.cards || [])
    .map((card) => card.scores?.[key])
    .filter((score): score is number => typeof score === 'number' && Number.isFinite(score))
  if (population.length <= 1) return { percentile: 50, populationSize: population.length }
  const lowerCount = population.filter((score) => score < value).length
  const equalCount = population.filter((score) => score === value).length
  const percentile = ((lowerCount + Math.max(0, equalCount - 1) / 2) / (population.length - 1)) * 100
  return { percentile: Math.max(0, Math.min(100, percentile)), populationSize: population.length }
}

function rankingScoreTitle(score: {
  description: string
  display: 'percentile' | 'absolute'
  displayValue: number | null
  value: number | null
  range: { min: number; max: number } | null
  theoreticalPercent: number | null
  percentile: number | null
  populationSize: number
}) {
  if (score.value === null || score.displayValue === null) return score.description
  const comparison = score.display === 'absolute'
    ? `${formatScorePercentage(score.displayValue)} on its absolute 0–100 scale.`
    : score.populationSize === 1
      ? 'This is the only scored card on the board.'
      : `${formatPercentile(score.percentile)} percentile among ${score.populationSize} scored cards on this board.`
  const range = score.range === null
    ? 'Raw index ' + formatProjectedScore(score.value) + '.'
    : 'Raw index ' + formatProjectedScore(score.value) + ' on a ' + formatProjectedScore(score.range.min) + '–' + formatProjectedScore(score.range.max) + ' range (' + formatScorePercentage(score.theoreticalPercent) + ' of the theoretical range).'
  return score.description + ' ' + comparison + ' ' + range
}

function rankingScoreDisplay(score: { display: 'percentile' | 'absolute'; displayValue: number | null }) {
  return score.display === 'percentile' ? formatPercentilePercentage(score.displayValue) : formatScorePercentage(score.displayValue)
}

const rankingScores = computed(() => RANKING_SCORE_DEFINITIONS.map((definition) => {
  const value = projectedScore(definition.key)
  const range = projectedScoreRange(definition.key)
  const { percentile, populationSize } = boardPercentile(definition.key, value)
  const absoluteValue = 'displayKey' in definition ? projectedScore(definition.displayKey) : null
  return {
    ...definition,
    value,
    range,
    percentile,
    populationSize,
    displayValue: definition.display === 'percentile' ? percentile : absoluteValue,
    theoreticalPercent: value === null || range === null ? null : Math.max(0, Math.min(100, ((value - range.min) / (range.max - range.min)) * 100)),
  }
}))

const effortScore = computed(() => {
  const metadata = editor.frontmatter.signboard_v2
  const estimate = metadata && typeof metadata === 'object' && !Array.isArray(metadata) && 'estimate' in metadata
    ? metadata.estimate
    : null
  const value = estimate && typeof estimate === 'object' && !Array.isArray(estimate) && 'effort_points' in estimate && typeof estimate.effort_points === 'number'
    ? estimate.effort_points
    : null
  return { key: 'effort_points', label: 'Effort', description: 'Estimated effort for this work item.', displayValue: value }
})

const metricScores = computed(() => [...rankingScores.value, effortScore.value])

function metricTitle(score: Record<string, unknown>) {
  if (score.key === 'effort_points') return score.displayValue === null ? String(score.description) : `${score.description} ${score.displayValue} point${score.displayValue === 1 ? '' : 's'}.`
  return rankingScoreTitle(score as Parameters<typeof rankingScoreTitle>[0])
}

function metricDisplay(score: Record<string, unknown>) {
  if (score.key === 'effort_points') return score.displayValue === null ? '—' : `${score.displayValue} pts`
  return rankingScoreDisplay(score as Parameters<typeof rankingScoreDisplay>[0])
}

function metricTone(score: Record<string, unknown>) {
  if (score.key === 'effort_points') return 'is-neutral'
  return scoreTone(score.displayValue as number | null, score.key !== 'risk_reduction_index')
}

function metricTintOpacity(score: Record<string, unknown>) {
  if (score.key === 'effort_points') return '0.04'
  return scoreTintOpacity(score.displayValue as number | null, score.key !== 'risk_reduction_index')
}
</script>

<template>
  <button class="v2-editor-score-summary" type="button" aria-label="Open detailed V2 work fields" aria-haspopup="dialog" aria-controls="cardEditorV2DetailsModal" title="Open detailed V2 work fields" @click="props.onOpenDetails?.()">
    <div class="v2-editor-ranking-grid">
      <div v-for="score in metricScores" :key="score.key" class="v2-editor-ranking-score" :class="metricTone(score)" :style="{ '--score-tint-opacity': metricTintOpacity(score) }" :title="metricTitle(score)" :aria-label="`${score.label}: ${score.displayValue === null ? 'not available' : metricDisplay(score)}`">
        <span>{{ score.label }}</span>
        <strong>{{ metricDisplay(score) }}</strong>
      </div>
    </div>
  </button>
</template>

<style scoped>
.v2-editor-score-summary { display: inline-flex; flex: 0 0 auto; min-width: 0; align-items: center; margin: 0; padding: 3px 4px; border: 0; border-radius: 8px; background: transparent; color: inherit; text-align: left; cursor: pointer; transition: background-color 120ms ease; }
.v2-editor-score-summary:hover, .v2-editor-score-summary:focus-visible { background: color-mix(in srgb, var(--accent, #0b5fff) 7%, var(--bg-card, #fff)); }
.v2-editor-score-summary:focus-visible { outline: 2px solid var(--accent, #0b5fff); outline-offset: 2px; border-radius: 7px; }
.v2-editor-ranking-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.v2-editor-ranking-score { --score-tint-rgb: 100 116 139; display: grid; min-width: 58px; gap: 1px; padding: 3px 6px; border: 1px solid color-mix(in srgb, rgb(var(--score-tint-rgb)) 18%, var(--border, #e6e8ec)); border-radius: 6px; background: rgb(var(--score-tint-rgb) / var(--score-tint-opacity, .04)); }
.v2-editor-ranking-score.is-negative { --score-tint-rgb: 220 38 38; }
.v2-editor-ranking-score.is-positive { --score-tint-rgb: 21 128 61; }
.v2-editor-ranking-score > span { overflow: hidden; color: var(--muted, #6b7280); font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.v2-editor-ranking-score > strong { color: var(--text, #111827); font-size: 12px; font-variant-numeric: tabular-nums; }
@media (max-width: 580px) { .v2-editor-ranking-grid { gap: 4px; } .v2-editor-ranking-score { min-width: 52px; padding-inline: 4px; } }
</style>
