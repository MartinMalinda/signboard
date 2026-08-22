<script setup lang="ts">
import { computed } from 'vue'
import { useBoardDataStore } from '../stores/useBoardDataStore'
import { getCardDisplayTitle } from '../../lib/cardTitle.js'
import type { BoardV2Snapshot, CardSnapshot } from '../types'
import {
  compareDashboardCards,
  dashboardCardsForSection,
  dashboardSectionFor,
  formatDashboardSectionReason,
} from '../../lib/dashboardSections'
import { formatImpactScore } from '../../lib/impactScore'
import Tooltip from '../lib/components/Tooltip.vue'
import V2SignalChip from './board/V2SignalChip.vue'
import { getListDisplayName } from '../../lib/listNaming.js'

const props = defineProps<{ onOpen?: (path: string) => void; onViewAll?: (section: string) => void }>()
const data = useBoardDataStore()

const SECTION_ORDER = ['priority', 'impact', 'low_hanging_fruit', 'blocked'] as const
const MAX_DASHBOARD_CARDS = 8
type SectionId = typeof SECTION_ORDER[number]
type DashboardCard = BoardV2Snapshot['cards'][number]
type DashboardSection = DashboardCard['sections'][number]

const SECTION_LABELS: Record<SectionId, string> = {
  priority: 'Priority',
  impact: 'Impact',
  low_hanging_fruit: 'Low-hanging fruit',
  blocked: 'Blocked',
}

const SECTION_ICONS: Record<SectionId, string> = {
  priority: '',
  impact: 'trending-up',
  low_hanging_fruit: 'zap',
  blocked: 'pause-circle',
}

const configuredSectionIds = computed<SectionId[]>(() => {
  const configured = data.snapshot?.v2?.profile.dashboard?.sections
  const sections = Array.isArray(configured)
    ? configured.filter((section): section is SectionId => SECTION_ORDER.includes(section as SectionId))
    : []
  return sections.length ? sections : [...SECTION_ORDER]
})

const cardsByPath = computed(() => {
  const cards = data.lists.flatMap((list) => list.cards)
  return new Map(cards.map((card) => [card.cardPath, card]))
})

const dashboardCards = computed(() => data.snapshot?.v2?.cards || [])
function isUnshaped(card: DashboardCard) {
  return card.metadata?.present !== true || card.metadata?.valid !== true || card.scores?.priority_index === null || card.stageSemantics?.mapped !== true || card.stageSemantics?.ambiguous === true
}
const unshapedCards = computed(() => dashboardCards.value.filter(isUnshaped))

function sectionProjectionFor(card: DashboardCard, sectionId: SectionId): DashboardSection | undefined {
  return dashboardSectionFor(card, sectionId)
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function displayValue(value: unknown) {
  return String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function cardMetadata(card: DashboardCard) {
  const metadata = objectValue(card.metadata)
  const normalized = objectValue(card.normalized)
  return {
    kind: String(metadata.kind || normalized.kind || '').trim(),
    priority: String(metadata.priority_class || normalized.priority_class || '').trim().toUpperCase(),
    status: String(normalized.status || '').trim().toLowerCase(),
  }
}

function isBlockedCard(card: DashboardCard) {
  const metadata = objectValue(card.metadata)
  const normalized = objectValue(card.normalized)
  return String(normalized.status || '').trim().toLowerCase() === 'blocked' ||
    metadata.blocked_on_decision === true ||
    (Array.isArray(metadata.blocked_by) && metadata.blocked_by.length > 0)
}

function cardStage(card: DashboardCard) {
  if (card.stageSemantics) {
    return card.stageSemantics.mapped === true && card.stageSemantics.ambiguous !== true
      ? String(card.stageSemantics.stage || '')
      : ''
  }
  const status = cardMetadata(card).status
  return status
}

function sectionSignalLabel(card: DashboardCard, sectionId: SectionId) {
  const details = cardMetadata(card)
  if (sectionId === 'priority' || sectionId === 'impact') return getListDisplayName(card.listName)
  if (sectionId === 'low_hanging_fruit') return 'Quick win'
  return 'Blocked'
}

function sectionTooltip(card: DashboardCard, sectionId: SectionId, rank: number) {
  const section = sectionProjectionFor(card, sectionId)
  const tieBreak = objectValue(section?.tie_break_inputs)
  const score = typeof tieBreak.score === 'number' ? ` Its section score is ${Math.round(tieBreak.score)}.` : ''
  const rankText = `Ranked #${rank} in ${SECTION_LABELS[sectionId]}.`
  const reason = formatDashboardSectionReason(card, sectionId)
  const fallback = sectionId === 'priority' && section?.included !== true
    ? ' This is a fallback candidate because no cards matched the stricter Priority gates.'
    : ''
  return `${rankText} ${reason}${fallback}${score}`
}

function impactScore(card: DashboardCard) {
  const score = card.scores?.impact_index
  return typeof score === 'number' && Number.isFinite(score) ? score : null
}

function riskMarkers(card: DashboardCard) {
  const normalized = objectValue(card.normalized)
  const risk = objectValue(normalized.risk_prevented)
  const markers: Array<{ icon: string; label: string; tone: string; tooltip: string }> = []
  const highThreshold = 4
  if (Number(risk.likelihood) >= highThreshold) {
    markers.push({ icon: 'alert-triangle', label: 'High Risk', tone: 'risk', tooltip: 'Risk likelihood is 4/5 or higher.' })
  }
  if (Number(risk.harm) >= highThreshold) {
    markers.push({ icon: 'zap', label: 'High Damage', tone: 'risk', tooltip: 'Potential harm is 4/5 or higher.' })
  }
  if (Number(risk.blast_radius) >= highThreshold) {
    markers.push({ icon: 'maximize-2', label: 'Wide Impact', tone: 'risk', tooltip: 'Blast radius is 4/5 or higher.' })
  }
  return markers
}

function cardSignals(card: DashboardCard, sectionId: SectionId, rank: number) {
  const details = cardMetadata(card)
  const section = sectionProjectionFor(card, sectionId)
  const tieBreak = objectValue(section?.tie_break_inputs)
  const score = sectionId === 'impact'
    ? impactScore(card)
    : typeof tieBreak.score === 'number' ? Math.round(tieBreak.score) : null
  const formattedScore = score === null ? '' : sectionId === 'impact' ? formatImpactScore(score) : String(score)
  const riskSignals = sectionId === 'priority' ? riskMarkers(card).map((signal) => ({ ...signal, stage: '' })) : []
  const stage = sectionId === 'priority' || sectionId === 'impact' ? cardStage(card) : ''
  const sectionSignal = sectionId === 'impact'
    ? (stage ? [{ icon: '', label: sectionSignalLabel(card, sectionId), tone: 'why', stage, tooltip: sectionTooltip(card, sectionId, rank) }] : [])
    : [{ icon: SECTION_ICONS[sectionId], label: sectionSignalLabel(card, sectionId), tone: 'why', stage, tooltip: sectionTooltip(card, sectionId, rank) }]
  return [
    ...sectionSignal,
    ...riskSignals,
    ...(details.priority && sectionSignalLabel(card, sectionId) !== details.priority ? [{ icon: 'flag', label: details.priority, tone: 'priority', stage: '', tooltip: `Priority class ${details.priority}. A lower priority rank places this card nearer the top of its section.` }] : []),
    ...(score !== null ? [{ icon: 'bar-chart-2', label: formattedScore, tone: 'rank', stage: '', tooltip: `${SECTION_LABELS[sectionId]} ranking uses this card's priority, score (${formattedScore}), and status tie-breakers.` }] : []),
  ]
}

function cardsForSection(sectionId: SectionId) {
  return dashboardCardsForSection(dashboardCards.value, sectionId, data.snapshot?.v2?.profile)
    .slice()
    .sort((left, right) => compareDashboardCards(left, right, sectionId))
    .slice(0, MAX_DASHBOARD_CARDS)
}

const sections = computed(() => configuredSectionIds.value.map((id) => ({
  id,
  label: SECTION_LABELS[id],
  cards: cardsForSection(id),
})))

const summary = computed(() => ({
  priority: dashboardCardsForSection(dashboardCards.value, 'priority', data.snapshot?.v2?.profile).length,
  impact: dashboardCardsForSection(dashboardCards.value, 'impact', data.snapshot?.v2?.profile).length,
  blocked: dashboardCardsForSection(dashboardCards.value, 'blocked', data.snapshot?.v2?.profile).length,
}))

function legacyCard(card: DashboardCard): CardSnapshot | undefined {
  return cardsByPath.value.get(card.cardPath)
}

function cardTitle(card: DashboardCard) {
  const source = legacyCard(card)
  return source?.displayTitle || getCardDisplayTitle(source?.frontmatter?.title, card.cardName)
}

</script>

<template>
  <section id="dashboardView" class="dashboard-view" aria-label="Dashboard">
    <div class="dashboard-summary-row">
      <div class="dashboard-summary" aria-label="Dashboard summary">
        <span><strong>{{ summary.priority }}</strong> Priority</span>
        <span><strong>{{ summary.impact }}</strong> Impact</span>
        <span><strong>{{ summary.blocked }}</strong> Blocked</span>
      </div>
      <div v-if="unshapedCards.length" class="dashboard-unshaped" role="status">
        <button type="button" class="dashboard-unshaped-link" @click="props.onViewAll?.('unshaped')">Open unshaped cards</button>
      </div>
    </div>

    <div class="dashboard-sections">
      <section v-for="section in sections" :id="`dashboardSection-${section.id}`" :key="section.id" class="dashboard-section" :data-dashboard-section="section.id" :aria-labelledby="`dashboardSectionTitle-${section.id}`">
        <header class="dashboard-section-header">
          <h2 :id="`dashboardSectionTitle-${section.id}`">{{ section.label }}</h2>
          <button v-if="props.onViewAll" class="dashboard-view-all" type="button" @click="props.onViewAll(section.id)">View all</button>
        </header>
        <div v-if="section.cards.length" class="dashboard-card-list" role="list">
          <div v-for="(card, index) in section.cards" :key="`${section.id}-${card.cardPath}`" class="dashboard-card" :class="{ 'dashboard-card-blocked': isBlockedCard(card) }" role="listitem" :data-path="card.cardPath" @click="props.onOpen?.(card.cardPath)">
            <button class="dashboard-card-open" type="button" @click.stop="props.onOpen?.(card.cardPath)">
              <span class="dashboard-card-title">{{ cardTitle(card) }}</span>
            </button>
            <span class="dashboard-card-signals" aria-label="Why this card is featured">
              <template v-for="signal in cardSignals(card, section.id, index + 1)" :key="`${signal.tone}-${signal.label}`">
                <Tooltip as="span" class="dashboard-card-signal-tooltip" popper-class="dashboard-card-tooltip" :content="signal.tooltip" placement="top">
                  <V2SignalChip class="dashboard-card-signal" :class="[ `dashboard-card-signal-${signal.tone}`, signal.stage ? `dashboard-card-signal-stage-${signal.stage}` : '' ]" :label="signal.label" :icon="signal.icon" :tone="signal.tone" :aria-label="signal.tooltip" />
                </Tooltip>
              </template>
            </span>
          </div>
        </div>
        <p v-else class="dashboard-empty">No cards match.</p>
      </section>
    </div>
  </section>
</template>

<style scoped>
.dashboard-view { box-sizing: border-box; width: 100%; padding: 24px; overflow: auto; }
.dashboard-section-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.dashboard-section h2 { margin: 0; }
.dashboard-empty { color: var(--muted, #6b7280); }
.dashboard-summary-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 18px; }
.dashboard-summary { display: flex; flex: 1 1 auto; flex-wrap: wrap; gap: 8px; min-width: 0; }
.dashboard-summary span { padding: 5px 9px; border: 1px solid var(--border, #e6e8ec); border-radius: 999px; color: var(--muted, #6b7280); font-size: 12px; }
.dashboard-summary strong { margin-right: 4px; color: inherit; }
.dashboard-unshaped { display: flex; flex: 0 0 auto; justify-content: flex-end; }
.dashboard-unshaped-link { border: 0; background: transparent; color: var(--primary, #0b5fff); cursor: pointer; }
.dashboard-sections { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; width: 100%; margin-top: 24px; }
.dashboard-section { min-width: 0; padding: 16px; border: 1px solid var(--border, #e6e8ec); border-radius: 10px; background: var(--surface, #fff); }
.dashboard-section-header { margin-bottom: 12px; }
.dashboard-view-all { border: 0; background: transparent; color: var(--primary, #0b5fff); cursor: pointer; }
.dashboard-card-list { display: grid; gap: 8px; }
.dashboard-card { display: grid; gap: 7px; width: 100%; padding: 10px; border: 1px solid var(--border, #e6e8ec); border-radius: 8px; background: transparent; color: inherit; text-align: left; cursor: pointer; }
.dashboard-card:hover, .dashboard-card:focus-visible { border-color: var(--primary, #0b5fff); }
.dashboard-card-blocked { border-color: color-mix(in srgb, var(--danger, #d92d20) 28%, var(--border, #e6e8ec)); }
.dashboard-card-open { display: block; width: 100%; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.dashboard-card-open:focus-visible { outline: 2px solid var(--primary, #0b5fff); outline-offset: 2px; border-radius: 4px; }
.dashboard-card-title { font-weight: 650; }
.dashboard-card-signals { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; min-width: 0; color: var(--muted, #6b7280); }
.dashboard-card-signal-tooltip { display: inline-flex; max-width: 100%; }
.dashboard-card-signal { display: inline-flex; align-items: center; gap: 3px; min-height: 19px; max-width: 100%; padding: 1px 6px; border: 1px solid var(--border, #e6e8ec); border-radius: 999px; color: var(--muted, #6b7280); font-size: 10px; line-height: 1.2; white-space: nowrap; }
.dashboard-card-signal-why { border-color: color-mix(in srgb, var(--primary, #0b5fff) 42%, var(--border, #e6e8ec)); color: var(--primary, #0b5fff); font-weight: 650; }
.dashboard-card-signal-stage-inbox { --dashboard-stage-color: #64748b; }
.dashboard-card-signal-stage-shaping { --dashboard-stage-color: #d97706; }
.dashboard-card-signal-stage-ready { --dashboard-stage-color: #2563eb; }
.dashboard-card-signal-stage-active { --dashboard-stage-color: #7c3aed; }
.dashboard-card-signal-stage-review { --dashboard-stage-color: #ea580c; }
.dashboard-card-signal-stage-blocked { --dashboard-stage-color: #dc2626; }
.dashboard-card-signal-stage-done { --dashboard-stage-color: #16a34a; }
.dashboard-card-signal-stage-dropped { --dashboard-stage-color: #6b7280; }
.dashboard-card-signal[class*="dashboard-card-signal-stage-"] {
  border-color: color-mix(in srgb, var(--dashboard-stage-color) 48%, var(--border, #e6e8ec));
  background: color-mix(in srgb, var(--dashboard-stage-color) 10%, transparent);
  color: color-mix(in srgb, var(--dashboard-stage-color) 84%, var(--text, #111827));
}
.dashboard-card-signal-priority { border-color: color-mix(in srgb, var(--primary, #0b5fff) 45%, var(--border, #e6e8ec)); color: var(--primary, #0b5fff); font-weight: 700; }
.dashboard-card-signal-risk { border-color: color-mix(in srgb, var(--danger, #d92d20) 38%, var(--border, #e6e8ec)); color: var(--danger, #d92d20); font-weight: 700; }
.dashboard-card-signal-rank { color: var(--text, #111827); }
@media (max-width: 960px) { .dashboard-sections { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 700px) { .dashboard-sections { grid-template-columns: 1fr; } }
</style>
