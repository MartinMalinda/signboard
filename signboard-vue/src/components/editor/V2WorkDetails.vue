<script setup lang="ts">
import { computed, ref } from 'vue'
import { getListDisplayName } from '../../../lib/listNaming.js'
import { useBoardDataStore } from '../../stores/useBoardDataStore'
import { useEditorStore } from '../../stores/useEditorStore'
import FeatherIcon from '../FeatherIcon.vue'
import Tooltip from '../../lib/components/Tooltip.vue'
import V2RelatedTaskSelect from './V2RelatedTaskSelect.vue'
import { getCardDisplayTitle } from '../../../lib/cardTitle.js'

const props = defineProps<{ listPaths: string[]; onMove: (path: string) => Promise<boolean> }>()
const editor = useEditorStore()
const data = useBoardDataStore()
const detailsOpen = ref(false)

const ADVANCED_GROUPS = [
  { group: 'opportunity', label: 'Opportunity', icon: 'target', description: 'Positive user, customer, operator, or business benefit created by the work.' },
  { group: 'risk_prevented', label: 'Risk addressed', icon: 'shield', description: 'Existing risk and how effectively the proposed work addresses it, covering security, privacy, correctness, data integrity, reliability, compliance, operations, and destructive technical debt.' },
  { group: 'discovery_value', label: 'Discovery value', icon: 'search', description: 'Value of reducing uncertainty before making an important decision.' },
  { group: 'delivery', label: 'Change risk', icon: 'truck', description: 'Bad conditions the proposed change may create after delivery, measured through regression likelihood, change blast radius, and reversibility.' },
  { group: 'modifiers', label: 'Modifiers', icon: 'sliders', description: 'General factors applied to the core value: evidence confidence, cost of delay, and ongoing maintenance burden.' },
] as const
const ADVANCED_FIELDS = [
  { group: 'opportunity', field: 'reach', label: 'Reach', min: 0, max: 5, description: 'Size of the relevant target population over a defined horizon; 1 is a very small segment and 5 is nearly all relevant users.' },
  { group: 'opportunity', field: 'benefit', label: 'Benefit', min: 0, max: 5, description: 'Magnitude of the positive outcome; 1 is cosmetic or minor and 5 is transformative or removes a critical blocker.' },
  { group: 'opportunity', field: 'frequency', label: 'Frequency', min: 0, max: 5, description: 'How often the benefit recurs; 1 is rare or one-off and 5 is daily, continuous, or central to the normal workflow.' },
  { group: 'risk_prevented', field: 'likelihood', label: 'Risk likelihood', min: 0, max: 5, description: 'Likelihood of the risk over a stated horizon, normally the next 12 months; 1 is rare and 5 is observed, active, recurring, or expected.' },
  { group: 'risk_prevented', field: 'harm', label: 'Risk harm', min: 0, max: 5, description: 'Severity of harm to an affected unit; 1 is negligible and 5 is catastrophic, unrecoverable, security-critical, or regulatory harm.' },
  { group: 'risk_prevented', field: 'blast_radius', label: 'Risk blast radius', min: 0, max: 5, description: 'Scope if the risk occurs; 1 is local or isolated and 5 is system-wide, cross-customer, externally propagating, or irreversible.' },
  { group: 'risk_prevented', field: 'mitigation_effectiveness', label: 'Mitigation effectiveness', min: 0, max: 5, description: 'Expected reduction in the identified risk; 1 is about 20% and 5 is nearly complete mitigation.' },
  { group: 'discovery_value', field: 'uncertainty_reduction', label: 'Uncertainty reduction', min: 0, max: 5, description: 'How much uncertainty this work is expected to remove; 1 is little and 5 is a major reduction in uncertainty.' },
  { group: 'discovery_value', field: 'decision_importance', label: 'Decision importance', min: 0, max: 5, description: 'Importance of the decision enabled by the discovery; 1 is minor and 5 changes a critical direction.' },
  { group: 'discovery_value', field: 'cost_of_wrong_choice', label: 'Cost of wrong choice', min: 0, max: 5, description: 'Cost of making the wrong decision without this discovery; 1 is low and 5 is severe or difficult to reverse.' },
  { group: 'delivery', field: 'regression_likelihood', label: 'Regression likelihood', min: 0, max: 5, description: 'Likelihood that an incorrect implementation or deployment causes regressions; 1 is highly local and understood and 5 is highly coupled, novel, or poorly understood.' },
  { group: 'delivery', field: 'change_blast_radius', label: 'Change blast radius', min: 0, max: 5, description: 'Scope of harm from a bad implementation, separate from the problem being fixed; 1 is local or test-only and 5 is system-wide, cross-customer, or potentially destructive.' },
  { group: 'delivery', field: 'reversibility', label: 'Reversibility', min: 0, max: 5, description: 'Ease of rolling back the change; 1 is effectively irreversible and 5 is a trivial revert, feature flag, or isolated deployment.' },
  { group: 'modifiers', field: 'confidence', label: 'Confidence', min: 1, max: 5, description: 'Confidence in the problem, expected outcome, and score—not confidence that implementation will be easy; 1 is speculative and 5 is measured, reproduced, confirmed, or contractually required.' },
  { group: 'modifiers', field: 'urgency', label: 'Urgency', min: 1, max: 5, description: 'Cost of delay or time sensitivity; 1 has no meaningful time sensitivity and 5 has an imminent deadline, rapidly increasing risk, or current customer impact.' },
  { group: 'modifiers', field: 'maintenance_delta', label: 'Maintenance delta', min: -2, max: 2, description: 'Expected ongoing burden of the resulting solution; −2 adds substantial maintenance, 0 is neutral, and +2 eliminates substantial burden or a maintained subsystem.' },
]
const STANDARD_SCORE_OPTIONS = [1, 2, 3, 4, 5]
const MAINTENANCE_SCORE_OPTIONS = [-2, -1, 0, 1, 2]
const V2_TOP_LEVEL_FIELDS = ['contract_version', 'id', 'kind', 'priority_class', 'parent', 'depends_on', 'blocked_by', 'blocked_on_decision', 'estimate', 'opportunity', 'risk_prevented', 'discovery_value', 'modifiers', 'delivery']
const V2_GROUP_FIELDS: Record<string, string[]> = {
  estimate: ['effort_points'],
  opportunity: ['reach', 'benefit', 'frequency'],
  risk_prevented: ['likelihood', 'harm', 'blast_radius', 'mitigation_effectiveness'],
  discovery_value: ['uncertainty_reduction', 'decision_importance', 'cost_of_wrong_choice'],
  modifiers: ['confidence', 'urgency', 'maintenance_delta'],
  delivery: ['regression_likelihood', 'change_blast_radius', 'reversibility'],
}
const RANKING_SCORE_DEFINITIONS = [
  { key: 'priority_index', label: 'Priority', description: 'Relative ranking score used by the Priority section.', display: 'percentile' },
  { key: 'impact_index', label: 'Impact', description: 'Positive impact adjusted for confidence and effort.', display: 'percentile' },
  { key: 'risk_reduction_index', displayKey: 'risk_reduction', label: 'Risk reduction', description: 'Absolute amount of existing risk addressed by the work.', display: 'absolute' },
] as const

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function clone(value: unknown): Record<string, unknown> {
  return isObject(value) ? JSON.parse(JSON.stringify(value)) as Record<string, unknown> : {}
}

function trimV2Metadata(value: unknown) {
  const source = clone(value)
  const next: Record<string, unknown> = {}
  for (const field of V2_TOP_LEVEL_FIELDS) {
    if (!(field in source)) continue
    const groupFields = V2_GROUP_FIELDS[field]
    if (!groupFields) {
      next[field] = source[field]
      continue
    }
    const group = isObject(source[field]) ? source[field] : {}
    const trimmed = Object.fromEntries(groupFields.filter((key) => key in group).map((key) => [key, group[key]]))
    if (Object.keys(trimmed).length) next[field] = trimmed
  }
  return next
}

const profileDefaults = computed(() => data.snapshot?.v2?.profile?.cardDefaults || {})
const v2Metadata = computed(() => isObject(editor.frontmatter.signboard_v2) ? editor.frontmatter.signboard_v2 : {})
const kind = computed(() => String(v2Metadata.value.kind || profileDefaults.value.kind || 'task'))
const priority = computed(() => String(v2Metadata.value.priority_class || profileDefaults.value.priorityClass || 'P2').toUpperCase())
const effort = computed(() => {
  const estimate = isObject(v2Metadata.value.estimate) ? v2Metadata.value.estimate : {}
  return typeof estimate.effort_points === 'number' ? String(estimate.effort_points) : ''
})
const currentListPath = computed(() => props.listPaths.find((path) => editor.cardPath.startsWith(`${path}/`)) || '')
const currentListName = computed(() => currentListPath.value ? getListDisplayName(currentListPath.value.split('/').pop() || '') : 'Unknown stage')
const dependencies = computed(() => Array.isArray(v2Metadata.value.depends_on) ? v2Metadata.value.depends_on.map(String) : [])
const blockedBy = computed(() => Array.isArray(v2Metadata.value.blocked_by) ? v2Metadata.value.blocked_by.map(String) : [])
const blockedOnDecision = computed(() => v2Metadata.value.blocked_on_decision === true)
const relatedTaskOptions = computed(() => {
  const seen = new Set<string>()
  const options: Array<{ value: string; label: string; context: string }> = []
  for (const list of data.lists) {
    for (const card of list.cards) {
      if (card.cardPath === editor.cardPath) continue
      const title = card.displayTitle || getCardDisplayTitle(card.frontmatter.title, card.cardName)
      if (!title || seen.has(title)) continue
      seen.add(title)
      options.push({ value: title, label: title, context: getListDisplayName(list.listName) || list.listName })
    }
  }
  return options
})
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

function scoreTone(value: number | null) {
  if (value === null || (value > 25 && value < 75)) return 'is-neutral'
  return value <= 25 ? 'is-negative' : 'is-positive'
}

function scoreTintOpacity(value: number | null) {
  if (value === null || (value > 25 && value < 75)) return '0.04'
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
    ? `Raw index ${formatProjectedScore(score.value)}.`
    : `Raw index ${formatProjectedScore(score.value)} on a ${formatProjectedScore(score.range.min)}–${formatProjectedScore(score.range.max)} range (${formatScorePercentage(score.theoreticalPercent)} of the theoretical range).`
  return `${score.description} ${comparison} ${range}`
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
function label(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function updateV2(nextPartial: Record<string, unknown>) {
  const next = { ...trimV2Metadata(v2Metadata.value), contract_version: 1, ...nextPartial }
  editor.frontmatter = { ...editor.frontmatter, signboard_v2: next }
  editor.queueSave()
}

function updateEffort(value: number) {
  const estimate = clone(v2Metadata.value.estimate)
  if (estimate.effort_points === value) delete estimate.effort_points
  else estimate.effort_points = value
  updateV2(Object.keys(estimate).length ? { estimate } : { estimate: undefined })
}

function updateDependencies(field: 'depends_on' | 'blocked_by', values: string[]) {
  updateV2({ [field]: values.length ? values : undefined })
}

function updateBlockedOnDecision(event: Event) {
  updateV2({ blocked_on_decision: (event.target as HTMLInputElement).checked })
}

function readAdvancedValue(group: string, field: string) {
  const values = isObject(v2Metadata.value[group]) ? v2Metadata.value[group] : {}
  const value = values[field]
  return typeof value === 'number' ? value : ''
}

function scoreOptions(field: { field: string }, currentValue: number | '') {
  const options = field.field === 'maintenance_delta' ? MAINTENANCE_SCORE_OPTIONS : STANDARD_SCORE_OPTIONS
  return currentValue === 0 && field.field !== 'maintenance_delta' ? [0, ...options] : options
}

function scoreOptionLabel(field: { field: string }, value: number) {
  if (value === 0 && field.field !== 'maintenance_delta') return 'N/A'
  if (field.field === 'maintenance_delta' && value > 0) return `+${value}`
  return String(value)
}

function scoreOptionTone(field: { field: string }, value: number) {
  if (value === 0 && field.field !== 'maintenance_delta') return ''
  const threeBandTone = (low: string, mid: string, high: string) => value <= 2 ? low : value === 3 ? mid : high
  if (['reach', 'benefit', 'frequency'].includes(field.field)) return threeBandTone('score-option-tone-neutral', 'score-option-tone-success-soft', 'score-option-tone-success-strong')
  if (['likelihood', 'harm', 'blast_radius'].includes(field.field)) return threeBandTone('score-option-tone-neutral', 'score-option-tone-amber-soft', 'score-option-tone-amber-strong')
  if (field.field === 'mitigation_effectiveness') return threeBandTone('score-option-tone-danger-soft', 'score-option-tone-neutral', 'score-option-tone-success-strong')
  if (['regression_likelihood', 'change_blast_radius'].includes(field.field)) return threeBandTone('score-option-tone-success-strong', 'score-option-tone-neutral', 'score-option-tone-danger-strong')
  if (field.field === 'reversibility') return value === 1 ? 'score-option-tone-danger-strong' : value === 2 ? 'score-option-tone-danger-soft' : value === 3 ? 'score-option-tone-neutral' : value === 4 ? 'score-option-tone-success-soft' : 'score-option-tone-success-strong'
  if (field.field === 'confidence') return threeBandTone('score-option-tone-neutral', 'score-option-tone-info-soft', 'score-option-tone-info-strong')
  if (field.field === 'urgency') return threeBandTone('score-option-tone-neutral', 'score-option-tone-amber-soft', 'score-option-tone-amber-strong')
  if (field.field === 'maintenance_delta') return value === -2 ? 'score-option-tone-danger-strong' : value === -1 ? 'score-option-tone-danger-soft' : value === 0 ? 'score-option-tone-neutral' : value === 1 ? 'score-option-tone-success-soft' : 'score-option-tone-success-strong'
  return ''
}

function updateAdvancedValue(group: string, field: string, value: number) {
  const values = clone(v2Metadata.value[group])
  if (values[field] === value) delete values[field]
  else values[field] = value
  updateV2({ [group]: values })
}

</script>

<template>
  <section class="v2-editor-work-details" aria-labelledby="cardEditorWorkDetailsTitle">
    <button id="cardEditorWorkDetailsSummary" class="v2-editor-work-summary" type="button" :aria-expanded="detailsOpen" aria-controls="cardEditorWorkDetailsPanel" @click="detailsOpen = !detailsOpen">
      <span class="v2-editor-work-summary-copy"><span class="v2-editor-eyebrow">V2 work</span><strong id="cardEditorWorkDetailsTitle">{{ label(kind) }} · {{ priority }}<template v-if="effort"> · {{ effort }} pts</template></strong></span>
      <span class="v2-editor-work-summary-stage">{{ currentListName }} <FeatherIcon :name="detailsOpen ? 'chevron-up' : 'chevron-down'" :size="15" /></span>
    </button>
    <div v-if="detailsOpen" id="cardEditorWorkDetailsPanel" class="v2-editor-work-panel">
      <div class="v2-editor-relationship-grid">
        <div class="v2-editor-estimate-field">
          <span class="v2-editor-estimate-label">Effort points</span>
          <div class="v2-editor-score-options" role="group" aria-label="Effort points">
            <button v-for="option in STANDARD_SCORE_OPTIONS" :key="option" type="button" class="v2-editor-score-option" :class="{ 'is-selected': Number(effort) === option }" :aria-pressed="Number(effort) === option" @click="updateEffort(option)">{{ option }}</button>
          </div>
        </div>
        <V2RelatedTaskSelect label="Depends on" :model-value="dependencies" :options="relatedTaskOptions" @update:model-value="updateDependencies('depends_on', $event)" />
        <V2RelatedTaskSelect label="Blocked by" :model-value="blockedBy" :options="relatedTaskOptions" @update:model-value="updateDependencies('blocked_by', $event)" />
        <label class="v2-editor-decision-field"><input id="cardEditorBlockedOnDecision" type="checkbox" :checked="blockedOnDecision" @change="updateBlockedOnDecision" /> <span>Blocked on decision</span><Tooltip as="span" class="v2-editor-field-name" popper-class="v2-editor-tooltip" content="The decision details and context belong in the card body." placement="top" tabindex="0"><FeatherIcon name="help-circle" :size="13" /></Tooltip></label>
      </div>

      <div class="v2-editor-advanced-grid">
        <fieldset v-for="scoreGroup in ADVANCED_GROUPS" :key="scoreGroup.group" class="v2-editor-score-group" :class="`v2-editor-score-group-${scoreGroup.group}`">
          <legend><span class="v2-editor-score-group-heading"><FeatherIcon :name="scoreGroup.icon" :size="19" /><Tooltip as="span" class="v2-editor-score-group-name" popper-class="v2-editor-tooltip" :content="scoreGroup.description" placement="top" tabindex="0">{{ scoreGroup.label }}</Tooltip></span></legend>
          <div class="v2-editor-score-fields">
            <div v-for="field in ADVANCED_FIELDS.filter((item) => item.group === scoreGroup.group)" :key="`${field.group}.${field.field}`" class="v2-editor-score-field" :data-v2-score-field="field.field">
              <Tooltip as="span" class="v2-editor-field-name" popper-class="v2-editor-tooltip" :content="field.description" placement="top" tabindex="0">{{ field.label }}</Tooltip>
              <div class="v2-editor-score-options" role="group" :aria-label="`${field.label} score`">
                <button v-for="option in scoreOptions(field, readAdvancedValue(field.group, field.field))" :key="option" type="button" class="v2-editor-score-option" :class="[scoreOptionTone(field, option), { 'is-selected': readAdvancedValue(field.group, field.field) === option, 'is-na': option === 0 && field.field !== 'maintenance_delta' }]" :aria-pressed="readAdvancedValue(field.group, field.field) === option" @click="updateAdvancedValue(field.group, field.field, option)">{{ scoreOptionLabel(field, option) }}</button>
              </div>
            </div>
          </div>
        </fieldset>
        <fieldset class="v2-editor-score-group v2-editor-score-group-computed v2-editor-computed">
          <legend><span class="v2-editor-score-group-heading"><FeatherIcon name="activity" :size="19" /><span>Scoring</span></span></legend>
          <div class="v2-editor-computed-body">
            <section class="v2-editor-computed-section" aria-label="Ranking scores">
              <div class="v2-editor-ranking-grid">
                <div v-for="score in rankingScores" :key="score.key" class="v2-editor-ranking-score" :class="scoreTone(score.displayValue)" :style="{ '--score-tint-opacity': scoreTintOpacity(score.displayValue) }" :title="rankingScoreTitle(score)" :aria-label="`${score.label}: ${score.displayValue === null ? 'not available' : rankingScoreDisplay(score)}`">
                  <span>{{ score.label }}</span>
                  <strong>{{ rankingScoreDisplay(score) }}</strong>
                </div>
              </div>
            </section>
          </div>
        </fieldset>
      </div>
    </div>
  </section>
</template>

<style scoped>
.v2-editor-work-details { margin: 0 0 14px; border: 1px solid var(--border, #e6e8ec); border-radius: 8px; background: var(--surface, #fff); }
.v2-editor-work-summary { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border: 0; background: transparent; color: inherit; text-align: left; cursor: pointer; }
.v2-editor-work-summary-copy { display: grid; gap: 2px; min-width: 0; }
.v2-editor-eyebrow { color: var(--muted, #6b7280); font-size: 10px; letter-spacing: .06em; text-transform: uppercase; }
.v2-editor-work-summary-stage { display: inline-flex; flex: 0 0 auto; align-items: center; gap: 5px; color: var(--muted, #6b7280); font-size: 12px; }
.v2-editor-work-panel { display: grid; gap: 12px; padding: 0 12px 12px; }
.v2-editor-relationship-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: start; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border, #e6e8ec); }
.v2-editor-relationship-grid :deep(.v2-related-task-select) { min-width: 0; }
.v2-editor-decision-field { display: inline-flex; min-height: 32px; align-items: center; gap: 6px; color: var(--muted, #6b7280); font-size: 11px; }
.v2-editor-decision-field input { width: 15px; height: 15px; margin: 0; accent-color: var(--primary, #0b5fff); }
.v2-editor-advanced-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; align-items: start; }
.v2-editor-estimate-field { display: grid; min-width: 0; gap: 4px; }
.v2-editor-estimate-field .v2-editor-score-options { width: 100%; }
.v2-editor-estimate-field .v2-editor-score-option { flex: 1 1 0; }
.v2-editor-estimate-label, .v2-editor-advanced-grid label, .v2-editor-wide-field { color: var(--muted, #6b7280); font-size: 11px; }
.v2-editor-score-group { min-width: 0; margin: 0; padding: 14px 14px 8px; border: 1px solid var(--border, #e6e8ec); border-radius: 14px; background: var(--surface, #fff); }
.v2-editor-score-group legend { display: block; box-sizing: border-box; width: 100%; margin: 0 0 2px; padding: 0 0 12px; border-bottom: 1px solid var(--border, #e6e8ec); color: var(--text, #111827); font-size: 11px; font-weight: 650; }
.v2-editor-score-group-heading { display: flex; align-items: center; gap: 8px; color: var(--text, #111827); font-size: 16px; font-weight: 650; }
.v2-editor-score-group-opportunity .v2-editor-score-group-heading { color: #15803d; }
.v2-editor-score-group-risk_prevented .v2-editor-score-group-heading { color: #d97706; }
.v2-editor-score-group-delivery .v2-editor-score-group-heading { color: #dc2626; }
.v2-editor-score-group-modifiers .v2-editor-score-group-heading { color: #475569; }
.v2-editor-score-group-opportunity .v2-editor-score-group-heading > .feather-icon { color: #15803d; }
.v2-editor-score-group-risk_prevented .v2-editor-score-group-heading > .feather-icon { color: #d97706; }
.v2-editor-score-group-delivery .v2-editor-score-group-heading > .feather-icon { color: #dc2626; }
.v2-editor-score-group-modifiers .v2-editor-score-group-heading > .feather-icon { color: #475569; }
.v2-editor-score-group-name, .v2-editor-field-name { display: inline-flex; min-width: 0; align-items: center; }
.v2-editor-score-group-name, .v2-editor-field-name { cursor: help; }
.v2-editor-score-group-name:focus-visible, .v2-editor-field-name:focus-visible { outline: 2px solid var(--primary, #0b5fff); outline-offset: 2px; border-radius: 3px; }
.v2-editor-score-fields { display: grid; gap: 0; }
.v2-editor-score-field { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 12px; min-height: 58px; padding: 10px 0; border-bottom: 1px solid color-mix(in srgb, var(--border, #e6e8ec) 72%, transparent); }
.v2-editor-score-field:last-of-type { border-bottom: 0; }
.v2-editor-score-field > .v2-editor-field-name { color: var(--muted, #6b7280); font-size: 11px; }
.v2-editor-score-options { display: inline-flex; max-width: 100%; overflow: hidden; border: 1px solid var(--border, #e6e8ec); border-radius: 8px; background: var(--surface, #fff); }
.v2-editor-score-option { min-width: 20px; height: 20px; padding: 2px; border: 0; border-left: 1px solid var(--border, #e6e8ec); background: transparent; color: var(--text, #111827); font: inherit; font-size: 10.5px; line-height: 1.2; cursor: pointer; }
.v2-editor-score-option:first-child { border-left: 0; }
.v2-editor-score-option:hover { background: color-mix(in srgb, var(--primary, #0b5fff) 9%, var(--surface, #fff)); }
.v2-editor-score-option.is-selected { background: #64748b; color: #fff; }
.v2-editor-score-group-opportunity .v2-editor-score-option.is-selected { background: #15803d; }
.v2-editor-score-group-risk_prevented .v2-editor-score-option.is-selected { background: #d97706; }
.v2-editor-score-group-delivery .v2-editor-score-option.is-selected { background: #dc2626; }
.v2-editor-score-field[data-v2-score-field="confidence"] .v2-editor-score-option.is-selected { background: #2563eb; }
.v2-editor-score-field[data-v2-score-field="urgency"] .v2-editor-score-option.is-selected { background: #d97706; }
.v2-editor-score-option.is-selected.score-option-tone-danger-strong { background: #dc2626; color: #fff; }
.v2-editor-score-option.is-selected.score-option-tone-danger-soft { background: #fecaca; color: #991b1b; }
.v2-editor-score-option.is-selected.score-option-tone-neutral { background: #cbd5e1; color: #334155; }
.v2-editor-score-option.is-selected.score-option-tone-success-soft { background: #bbf7d0; color: #166534; }
.v2-editor-score-option.is-selected.score-option-tone-success-strong { background: #15803d; color: #fff; }
.v2-editor-score-option.is-selected.score-option-tone-amber-soft { background: #fed7aa; color: #9a3412; }
.v2-editor-score-option.is-selected.score-option-tone-amber-strong { background: #d97706; color: #fff; }
.v2-editor-score-option.is-selected.score-option-tone-info-soft { background: #bfdbfe; color: #1e3a8a; }
.v2-editor-score-option.is-selected.score-option-tone-info-strong { background: #2563eb; color: #fff; }
.v2-editor-score-option.is-na { min-width: 20px; color: var(--muted, #6b7280); font-size: 9px; }
.v2-editor-score-option.is-na.is-selected { background: var(--muted, #6b7280); color: var(--surface, #fff); }
.v2-editor-score-option:focus-visible { position: relative; z-index: 1; outline: 2px solid var(--primary, #0b5fff); outline-offset: -2px; }
.v2-editor-advanced-grid input:not([type="checkbox"]), .v2-editor-wide-field textarea { box-sizing: border-box; width: 100%; min-width: 0; min-height: 32px; height: 32px; padding: 5px 6px; border: 1px solid var(--border, #e6e8ec); border-radius: 5px; background: var(--surface, #fff); color: var(--text, #111827); font: inherit; font-size: 13px; line-height: 1.2; }
.v2-editor-wide-field textarea { resize: vertical; }
.v2-editor-score-group-computed .v2-editor-score-group-heading { color: #2563eb; }
.v2-editor-score-group-computed .v2-editor-score-group-heading > .feather-icon { color: #2563eb; }
.v2-editor-score-group-computed { grid-column: span 2; }
.v2-editor-computed-body { display: grid; gap: 8px; padding: 10px 0 6px; }
.v2-editor-computed-section { display: grid; gap: 8px; }
.v2-editor-ranking-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.v2-editor-ranking-score { --score-tint-rgb: 100 116 139; display: grid; min-width: 0; gap: 3px; padding: 9px 10px; border: 1px solid color-mix(in srgb, rgb(var(--score-tint-rgb)) 18%, var(--border, #e6e8ec)); border-radius: 8px; background: rgb(var(--score-tint-rgb) / var(--score-tint-opacity, .04)); }
.v2-editor-ranking-score.is-negative { --score-tint-rgb: 220 38 38; }
.v2-editor-ranking-score.is-positive { --score-tint-rgb: 21 128 61; }
.v2-editor-ranking-score > span { overflow: hidden; color: var(--muted, #6b7280); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.v2-editor-ranking-score > strong { color: var(--text, #111827); font-size: 17px; font-variant-numeric: tabular-nums; }
@media (max-width: 900px) { .v2-editor-advanced-grid, .v2-editor-ranking-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .v2-editor-score-group-computed { grid-column: span 1; } }
@media (max-width: 720px) { .v2-editor-relationship-grid { grid-template-columns: 1fr; } }
@media (max-width: 580px) { .v2-editor-advanced-grid, .v2-editor-ranking-grid { grid-template-columns: 1fr; } .v2-editor-score-field { grid-template-columns: 1fr; gap: 8px; } .v2-editor-score-options { width: 100%; } .v2-editor-score-option { flex: 1 1 0; } }
</style>
