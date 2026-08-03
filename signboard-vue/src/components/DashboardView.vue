<script setup lang="ts">
import { computed } from 'vue'
import { useBoardDataStore } from '../stores/useBoardDataStore'
import type { BoardV2Snapshot, CardSnapshot } from '../types'

const props = defineProps<{ onOpen?: (path: string) => void; onViewAll?: (section: string) => void }>()
const data = useBoardDataStore()

const SECTION_ORDER = ['critical', 'next_best_work', 'low_hanging_fruit', 'agent_loops', 'blocked'] as const
type SectionId = typeof SECTION_ORDER[number]
type DashboardCard = BoardV2Snapshot['cards'][number]
type DashboardSection = DashboardCard['sections'][number]

const SECTION_LABELS: Record<SectionId, string> = {
  critical: 'Critical',
  next_best_work: 'Next best work',
  low_hanging_fruit: 'Low-hanging fruit',
  agent_loops: 'Agent loops',
  blocked: 'Blocked',
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
  return card.metadata?.present !== true || card.metadata?.valid !== true || card.scores?.priority_index === null
}
const unshapedCards = computed(() => dashboardCards.value.filter(isUnshaped))

function sectionFor(card: DashboardCard, sectionId: SectionId): DashboardSection | undefined {
  return card.sections.find((section) => section?.name === sectionId && section.included === true)
}

function sectionRank(section: DashboardSection | undefined) {
  const tieBreak = section?.tie_break_inputs && typeof section.tie_break_inputs === 'object' && !Array.isArray(section.tie_break_inputs)
    ? section.tie_break_inputs as Record<string, unknown>
    : {}
  return {
    priority: typeof tieBreak?.priority_rank === 'number' ? tieBreak.priority_rank : Number.MAX_SAFE_INTEGER,
    score: typeof tieBreak?.score === 'number' ? tieBreak.score : Number.NEGATIVE_INFINITY,
    status: typeof tieBreak?.status_rank === 'number' ? tieBreak.status_rank : Number.MAX_SAFE_INTEGER,
  }
}

function cardsForSection(sectionId: SectionId) {
  return dashboardCards.value
    .filter((card) => sectionFor(card, sectionId))
    .slice()
    .sort((left, right) => {
      const leftRank = sectionRank(sectionFor(left, sectionId))
      const rightRank = sectionRank(sectionFor(right, sectionId))
      return leftRank.priority - rightRank.priority
        || rightRank.score - leftRank.score
        || leftRank.status - rightRank.status
        || left.cardName.localeCompare(right.cardName)
    })
    .slice(0, 3)
}

const sections = computed(() => configuredSectionIds.value.map((id) => ({
  id,
  label: SECTION_LABELS[id],
  cards: cardsForSection(id),
})))

const summary = computed(() => ({
  critical: dashboardCards.value.filter((card) => sectionFor(card, 'critical')).length,
  ready: dashboardCards.value.filter((card) => card.normalized?.status === 'ready').length,
  blocked: dashboardCards.value.filter((card) => sectionFor(card, 'blocked')).length,
  agent: dashboardCards.value.filter((card) => sectionFor(card, 'agent_loops')).length,
  scored: dashboardCards.value.length - unshapedCards.value.length,
  unshaped: unshapedCards.value.length,
}))

function legacyCard(card: DashboardCard): CardSnapshot | undefined {
  return cardsByPath.value.get(card.cardPath)
}

function cardTitle(card: DashboardCard) {
  const title = legacyCard(card)?.frontmatter?.title
  return String(title || '').replace(/^#\s*/, '').trim() || card.cardName.replace(/\.md$/i, '') || 'Untitled'
}

function cardSignal(card: DashboardCard) {
  const priority = String(card.metadata?.priority_class || '').trim()
  const kind = String(card.metadata?.kind || '').trim()
  return priority || kind || 'Unshaped'
}

function derivedBadge(sectionId: SectionId, card: DashboardCard) {
  if (card.missing_fields.length || card.warnings.some((warning) => warning.includes('METADATA'))) return 'Unshaped'
  if (sectionId === 'critical') return 'Critical'
  if (sectionId === 'low_hanging_fruit') return 'Quick win'
  if (sectionId === 'agent_loops') return 'Agent-ready'
  if (sectionId === 'blocked') return 'Blocked'
  return 'Recommended'
}

function reasonText(card: DashboardCard, sectionId: SectionId) {
  const reasonCodes = sectionFor(card, sectionId)?.reason_codes
  const reason = Array.isArray(reasonCodes) ? reasonCodes[0] : undefined
  if (reason === `SECTION_${sectionId.toUpperCase()}`) return `Included in ${SECTION_LABELS[sectionId].toLowerCase()}.`
  return String(reason || 'Included by the board projection.').replace(/_/g, ' ').toLowerCase()
}

function reasonForSection(sectionId: SectionId) {
  if (sectionId === 'critical') return 'P0/P1 work is shown before ordinary planning.'
  if (sectionId === 'blocked') return 'Blocked work stays visible while its dependency is resolved.'
  if (sectionId === 'agent_loops') return 'Ready P2 work must pass the autonomous policy gates.'
  if (sectionId === 'low_hanging_fruit') return 'Small work must also have confidence, verification, and reversibility.'
  return 'Eligible work is ranked by the shared snapshot projection.'
}
</script>

<template>
  <section id="dashboardView" class="dashboard-view" aria-labelledby="dashboardTitle">
    <header class="dashboard-header">
      <div>
        <p class="dashboard-eyebrow">V2 workspace</p>
        <h1 id="dashboardTitle">{{ data.snapshot?.v2?.profile.dashboard?.title || 'Dashboard' }}</h1>
        <p v-if="data.snapshot?.v2?.profile.dashboard?.description" class="dashboard-description">{{ data.snapshot.v2.profile.dashboard.description }}</p>
      </div>
      <span class="dashboard-profile-chip">{{ data.snapshot?.v2?.profile.title || data.snapshot?.v2?.profile.profileId || 'V2' }}</span>
    </header>
    <div class="dashboard-summary" aria-label="Dashboard summary">
      <span><strong>{{ summary.critical }}</strong> Critical</span>
      <span><strong>{{ summary.ready }}</strong> Ready</span>
      <span><strong>{{ summary.blocked }}</strong> Blocked</span>
      <span><strong>{{ summary.agent }}</strong> Agent-ready</span>
    </div>
    <p class="dashboard-score-status">{{ summary.scored }} scored · {{ summary.unshaped }} unshaped</p>
    <div v-if="unshapedCards.length" class="dashboard-unshaped" role="status">
      <span>Legacy or unshaped cards remain available in Kanban and Table.</span>
      <button type="button" class="dashboard-unshaped-link" @click="props.onViewAll?.('unshaped')">Open unshaped cards</button>
    </div>

    <div class="dashboard-sections">
      <section v-for="section in sections" :id="`dashboardSection-${section.id}`" :key="section.id" class="dashboard-section" :data-dashboard-section="section.id" :aria-labelledby="`dashboardSectionTitle-${section.id}`">
        <header class="dashboard-section-header">
          <h2 :id="`dashboardSectionTitle-${section.id}`">{{ section.label }}</h2>
          <button v-if="props.onViewAll" class="dashboard-view-all" type="button" @click="props.onViewAll(section.id)">View all</button>
        </header>
        <div v-if="section.cards.length" class="dashboard-card-list" role="list">
          <button v-for="card in section.cards" :key="`${section.id}-${card.cardPath}`" class="dashboard-card" type="button" role="listitem" :data-path="card.cardPath" @click="props.onOpen?.(card.cardPath)">
            <span class="dashboard-card-title">{{ cardTitle(card) }}</span>
            <span class="dashboard-card-meta">{{ card.listName }} · {{ cardSignal(card) }} · {{ derivedBadge(section.id, card) }}</span>
            <span class="dashboard-card-reason">{{ reasonText(card, section.id) }}</span>
          </button>
        </div>
        <p v-else class="dashboard-empty">No cards currently match this section. {{ reasonForSection(section.id) }}</p>
      </section>
    </div>
  </section>
</template>

<style scoped>
.dashboard-view { padding: 24px; overflow: auto; }
.dashboard-header, .dashboard-section-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.dashboard-eyebrow { margin: 0 0 4px; color: var(--muted, #6b7280); font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
.dashboard-header h1, .dashboard-section h2 { margin: 0; }
.dashboard-description, .dashboard-empty { color: var(--muted, #6b7280); }
.dashboard-profile-chip, .dashboard-card-meta { color: var(--muted, #6b7280); font-size: 12px; }
.dashboard-summary { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
.dashboard-summary span { padding: 5px 9px; border: 1px solid var(--border, #e6e8ec); border-radius: 999px; color: var(--muted, #6b7280); font-size: 12px; }
.dashboard-summary strong { margin-right: 4px; color: inherit; }
.dashboard-score-status { margin: 8px 0 0; color: var(--muted, #6b7280); font-size: 12px; }
.dashboard-unshaped { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; padding: 10px 12px; border-left: 3px solid var(--primary, #0b5fff); color: var(--muted, #6b7280); }
.dashboard-unshaped-link { border: 0; background: transparent; color: var(--primary, #0b5fff); cursor: pointer; }
.dashboard-sections { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-top: 24px; }
.dashboard-section { min-width: 0; padding: 16px; border: 1px solid var(--border, #e6e8ec); border-radius: 10px; background: var(--surface, #fff); }
.dashboard-section-header { margin-bottom: 12px; }
.dashboard-view-all { border: 0; background: transparent; color: var(--primary, #0b5fff); cursor: pointer; }
.dashboard-card-list { display: grid; gap: 8px; }
.dashboard-card { display: grid; gap: 4px; width: 100%; padding: 10px; border: 1px solid var(--border, #e6e8ec); border-radius: 8px; background: transparent; color: inherit; text-align: left; cursor: pointer; }
.dashboard-card:hover, .dashboard-card:focus-visible { border-color: var(--primary, #0b5fff); }
.dashboard-card-title { font-weight: 650; }
.dashboard-card-reason { color: var(--muted, #6b7280); font-size: 13px; }
@media (max-width: 700px) { .dashboard-unshaped { align-items: flex-start; flex-direction: column; } }
</style>
