import type { BoardV2Snapshot, V2BoardProfile } from '../src/types'
import { resolveV2StageSemantics } from './v2StageSemantics'

export const DASHBOARD_SECTION_IDS = Object.freeze([
  'priority',
  'impact',
  'low_hanging_fruit',
  'agent_loops',
  'blocked',
] as const)

export type DashboardSectionId = typeof DASHBOARD_SECTION_IDS[number]
export type DashboardCard = BoardV2Snapshot['cards'][number]
export type DashboardSection = DashboardCard['sections'][number]

const NON_ACTIONABLE_STAGES = new Set(['blocked', 'done', 'dropped'])
const TERMINAL_STAGES = new Set(['done', 'dropped'])

const REASON_LABELS: Record<string, string> = {
  A4_POLICY_NOT_SATISFIED: 'The stricter autonomous-merge policy is not satisfied.',
  AGENT_POLICY_FAILED: 'The agent execution policy is not satisfied.',
  AUTONOMY_BELOW_A3: 'Autonomy is below the A3 threshold.',
  AUTONOMY_LOW: 'Autonomy is low.',
  CONFIDENCE_LOW: 'Confidence is below the section threshold.',
  DEPENDENCY_UNRESOLVED: 'A dependency is unresolved.',
  EFFORT_TOO_LARGE: 'The estimated effort is too large for this section.',
  EXECUTION_POLICY_FAILED: 'The execution policy is not satisfied.',
  KIND_NOT_EXECUTABLE: 'This kind of work is not directly executable.',
  METADATA_GATE_FAILED: 'Required work metadata is incomplete.',
  METADATA_INVALID: 'Work metadata is invalid.',
  PRIORITY_AUTONOMY_CAP: 'Priority limits the autonomy class.',
  PRIORITY_INVALID: 'The priority class is invalid.',
  PRIORITY_NOT_AGENT_QUEUE: 'The priority class is outside the agent queue.',
  READINESS_FAILED: 'Readiness requirements are incomplete.',
  REVERSIBILITY_LOW: 'The change is not reversible enough for this section.',
  SECTION_INELIGIBLE: 'The card does not meet this section’s requirements.',
  STATUS_BLOCKED: 'The card is blocked.',
  STATUS_INVALID: 'The status is invalid.',
  STATUS_NOT_BLOCKED: 'The card is not blocked.',
  STATUS_NOT_PLANNABLE: 'The status is not currently plannable.',
  STATUS_NOT_READY: 'The card is not in Ready.',
  STATUS_TERMINAL: 'The card is in a terminal status.',
  VERIFICATION_WEAK: 'Verification is not strong enough for this section.',
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function includedInSection(card: DashboardCard, sectionId: string) {
  return dashboardSectionFor(card, sectionId)?.included === true
}

function stageSemanticsForCard(card: DashboardCard, profile?: V2BoardProfile) {
  const stageSemantics = card.stageSemantics
  if (stageSemantics && typeof stageSemantics === 'object') {
    return stageSemantics
  }

  const hasConfiguredStages = Object.values(profile?.stages || {}).some((listNames) => Array.isArray(listNames) && listNames.length > 0)
  if (profile?.enabled === true && hasConfiguredStages) {
    return resolveV2StageSemantics(profile, card.listName)
  }
  return null
}

function configuredStageForCard(card: DashboardCard, profile?: V2BoardProfile) {
  const stageSemantics = stageSemanticsForCard(card, profile)
  return stageSemantics && stageSemantics.mapped === true && stageSemantics.ambiguous !== true
    ? String(stageSemantics.stage || '')
    : ''
}

function hasUnresolvedStageSemantics(card: DashboardCard, profile?: V2BoardProfile) {
  const stageSemantics = stageSemanticsForCard(card, profile)
  return Boolean(
    stageSemantics &&
    (stageSemantics.mapped !== true || stageSemantics.ambiguous === true),
  )
}

function numericOr(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function sectionTieBreakInputs(card: DashboardCard, sectionId: string) {
  const section = dashboardSectionFor(card, sectionId)
  const tieBreak = objectValue(section?.tie_break_inputs)
  const scores = objectValue(card.scores)
  const fallbackScore = sectionId === 'agent_loops'
    ? scores.agent_pick_index
    : sectionId === 'impact'
      ? scores.impact_index
      : scores.priority_index
  return {
    priority: numericOr(tieBreak.priority_rank, Number.MAX_SAFE_INTEGER),
    score: numericOr(tieBreak.score, numericOr(fallbackScore, Number.NEGATIVE_INFINITY)),
    status: numericOr(tieBreak.status_rank, Number.MAX_SAFE_INTEGER),
    id: String(tieBreak.id || card.cardName || card.cardPath || ''),
  }
}

export function isDashboardSectionId(value: unknown): value is DashboardSectionId {
  return DASHBOARD_SECTION_IDS.includes(String(value || '') as DashboardSectionId)
}

export function dashboardSectionFor(card: DashboardCard, sectionId: string): DashboardSection | undefined {
  return Array.isArray(card.sections)
    ? card.sections.find((section) => section && section.name === sectionId)
    : undefined
}

export function dashboardSectionIncluded(card: DashboardCard, sectionId: string) {
  return includedInSection(card, sectionId)
}

export function isPriorityFallbackCard(card: DashboardCard, profile?: V2BoardProfile) {
  if (hasUnresolvedStageSemantics(card, profile)) return false
  const status = String(card.normalized?.status || '').trim().toLowerCase()
  const configuredStage = configuredStageForCard(card, profile)
  if (NON_ACTIONABLE_STAGES.has(status) || NON_ACTIONABLE_STAGES.has(configuredStage)) return false
  if (card.metadata?.kind === 'epic') return false
  if (includedInSection(card, 'blocked')) return false
  return true
}

export function isImpactCard(card: DashboardCard, profile?: V2BoardProfile) {
  if (hasUnresolvedStageSemantics(card, profile)) return false
  const status = String(card.normalized?.status || '').trim().toLowerCase()
  const configuredStage = configuredStageForCard(card, profile)
  return !TERMINAL_STAGES.has(status) && !TERMINAL_STAGES.has(configuredStage)
}

/** Return every card in a section. Presentation limits belong to the caller. */
export function dashboardCardsForSection(cards: DashboardCard[], sectionId: string, profile?: V2BoardProfile) {
  if (sectionId === 'impact') return cards.filter((card) => isImpactCard(card, profile))
  const included = cards.filter((card) => includedInSection(card, sectionId))
  if (sectionId !== 'priority' || included.length) return included
  return cards.filter((card) => isPriorityFallbackCard(card, profile))
}

export function compareDashboardCards(left: DashboardCard, right: DashboardCard, sectionId = 'priority') {
  const leftIncluded = sectionId === 'impact' ? isImpactCard(left) : includedInSection(left, sectionId)
  const rightIncluded = sectionId === 'impact' ? isImpactCard(right) : includedInSection(right, sectionId)
  if (leftIncluded !== rightIncluded) return leftIncluded ? -1 : 1

  const leftKey = sectionTieBreakInputs(left, sectionId)
  const rightKey = sectionTieBreakInputs(right, sectionId)
  if (sectionId === 'impact' || sectionId === 'agent_loops') {
    if (leftKey.score !== rightKey.score) return rightKey.score - leftKey.score
    if (leftKey.status !== rightKey.status) return leftKey.status - rightKey.status
    if (leftKey.priority !== rightKey.priority) return leftKey.priority - rightKey.priority
  } else {
    if (leftKey.priority !== rightKey.priority) return leftKey.priority - rightKey.priority
    if (leftKey.score !== rightKey.score) return rightKey.score - leftKey.score
    if (leftKey.status !== rightKey.status) return leftKey.status - rightKey.status
  }
  return leftKey.id.localeCompare(rightKey.id, undefined, { numeric: true, sensitivity: 'base', ignorePunctuation: true })
}

export function sortDashboardCards(cards: DashboardCard[], sectionId = 'priority', profile?: V2BoardProfile) {
  return dashboardCardsForSection(cards, sectionId, profile).slice().sort((left, right) => compareDashboardCards(left, right, sectionId))
}

export function dashboardSectionSortValues(card: DashboardCard, sectionId = 'priority') {
  const key = sectionTieBreakInputs(card, sectionId)
  return {
    score: key.score,
    priority: key.priority,
    status: key.status,
    cardName: key.id,
  }
}

export function dashboardSectionSortFields(sectionId = 'priority') {
  if (sectionId === 'impact' || sectionId === 'agent_loops') return [
    { field: 'dashboardSectionScore', order: -1 as const },
    { field: 'dashboardSectionStatusRank', order: 1 as const },
    { field: 'dashboardSectionPriorityRank', order: 1 as const },
    { field: 'dashboardSectionCardName', order: 1 as const },
  ]
  return [
    { field: 'dashboardSectionPriorityRank', order: 1 as const },
    { field: 'dashboardSectionScore', order: -1 as const },
    { field: 'dashboardSectionStatusRank', order: 1 as const },
    { field: 'dashboardSectionCardName', order: 1 as const },
  ]
}

export function dashboardSectionReasonCodes(card: DashboardCard, sectionId: string) {
  const section = dashboardSectionFor(card, sectionId)
  return Array.isArray(section?.reason_codes)
    ? section.reason_codes.map((reason) => String(reason)).filter(Boolean)
    : []
}

export function formatDashboardReasonCode(reasonCode: unknown) {
  const code = String(reasonCode || '').trim().toUpperCase()
  if (!code) return ''
  if (REASON_LABELS[code]) return REASON_LABELS[code]
  return `${code.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (character) => character.toUpperCase())}.`
}

export function formatDashboardReasonCodes(reasonCodes: unknown) {
  const reasons = Array.isArray(reasonCodes) ? reasonCodes.map(formatDashboardReasonCode).filter(Boolean) : []
  return [...new Set(reasons)].join(' ')
}

export function formatDashboardSectionReason(card: DashboardCard, sectionId: string) {
  const reason = formatDashboardReasonCodes(dashboardSectionReasonCodes(card, sectionId))
  return reason || (dashboardSectionIncluded(card, sectionId)
    ? 'This card meets the section requirements.'
    : 'This card does not meet the section requirements.')
}
