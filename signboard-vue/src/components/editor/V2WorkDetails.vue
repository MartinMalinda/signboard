<script setup lang="ts">
import { computed, ref } from 'vue'
import { getListDisplayName } from '../../../lib/listNaming.js'
import { useBoardDataStore } from '../../stores/useBoardDataStore'
import { useEditorStore } from '../../stores/useEditorStore'
import CardMoveControls from './CardMoveControls.vue'
import FeatherIcon from '../FeatherIcon.vue'
import V2RelatedTaskSelect from './V2RelatedTaskSelect.vue'

const props = defineProps<{ listPaths: string[]; onMove: (path: string) => Promise<boolean>; onOpenDashboard?: (section: string) => void }>()
const editor = useEditorStore()
const data = useBoardDataStore()
const detailsOpen = ref(false)
const advancedOpen = ref(false)

const KIND_OPTIONS = ['task', 'discovery', 'epic', 'incident']
const WORK_TYPE_OPTIONS = ['product', 'ux', 'security', 'correctness', 'data_integrity', 'reliability', 'performance', 'compliance', 'privacy', 'engineering_health', 'technical_debt', 'observability', 'operations', 'enablement', 'discovery', 'documentation']
const PRIORITY_OPTIONS = ['', 'P0', 'P1', 'P2', 'P3']
const ADVANCED_FIELDS = [
  { group: 'opportunity', field: 'reach', label: 'Reach', min: 0, max: 5 },
  { group: 'opportunity', field: 'benefit', label: 'Benefit', min: 0, max: 5 },
  { group: 'opportunity', field: 'frequency', label: 'Frequency', min: 0, max: 5 },
  { group: 'risk_prevented', field: 'likelihood', label: 'Risk likelihood', min: 0, max: 5 },
  { group: 'risk_prevented', field: 'harm', label: 'Risk harm', min: 0, max: 5 },
  { group: 'risk_prevented', field: 'blast_radius', label: 'Risk blast radius', min: 0, max: 5 },
  { group: 'risk_prevented', field: 'mitigation_effectiveness', label: 'Mitigation effectiveness', min: 0, max: 5 },
  { group: 'delivery', field: 'regression_likelihood', label: 'Regression likelihood', min: 0, max: 5 },
  { group: 'delivery', field: 'change_blast_radius', label: 'Change blast radius', min: 0, max: 5 },
  { group: 'delivery', field: 'reversibility', label: 'Reversibility', min: 0, max: 5 },
  { group: 'delivery', field: 'behavior_surface', label: 'Behavior surface', min: 0, max: 5 },
  { group: 'delivery', field: 'data_sensitivity', label: 'Data sensitivity', min: 0, max: 5 },
  { group: 'modifiers', field: 'confidence', label: 'Confidence', min: 1, max: 5 },
  { group: 'modifiers', field: 'strategic_fit', label: 'Strategic fit', min: 1, max: 5 },
  { group: 'modifiers', field: 'urgency', label: 'Urgency', min: 1, max: 5 },
  { group: 'modifiers', field: 'maintenance_delta', label: 'Maintenance delta', min: -2, max: 2 },
  { group: 'execution', field: 'specification_clarity', label: 'Specification clarity', min: 0, max: 5 },
  { group: 'execution', field: 'verification_strength', label: 'Verification strength', min: 0, max: 5 },
  { group: 'execution', field: 'boundedness', label: 'Boundedness', min: 0, max: 5 },
  { group: 'execution', field: 'isolation', label: 'Isolation', min: 0, max: 5 },
]
const POLICY_FIELDS = [
  { field: 'do_not_autorun', label: 'Do not auto-run' },
  { field: 'agent_execution_blocked', label: 'Block agent execution' },
  { field: 'autonomous_execution_blocked', label: 'Block autonomous execution' },
]

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function clone(value: unknown): Record<string, unknown> {
  return isObject(value) ? JSON.parse(JSON.stringify(value)) as Record<string, unknown> : {}
}

const profileDefaults = computed(() => data.snapshot?.v2?.profile?.cardDefaults || {})
const v2Metadata = computed(() => isObject(editor.frontmatter.signboard_v2) ? editor.frontmatter.signboard_v2 : {})
const kind = computed(() => String(v2Metadata.value.kind || profileDefaults.value.kind || 'task'))
const workType = computed(() => String(v2Metadata.value.work_type || profileDefaults.value.workType || 'product'))
const priority = computed(() => String(v2Metadata.value.priority_class || profileDefaults.value.priorityClass || 'P2').toUpperCase())
const effort = computed(() => {
  const estimate = isObject(v2Metadata.value.estimate) ? v2Metadata.value.estimate : {}
  return typeof estimate.effort_points === 'number' ? String(estimate.effort_points) : ''
})
const currentListPath = computed(() => props.listPaths.find((path) => editor.cardPath.startsWith(`${path}/`)) || '')
const currentListName = computed(() => currentListPath.value ? getListDisplayName(currentListPath.value.split('/').pop() || '') : 'Unknown stage')
const dependencies = computed(() => Array.isArray(v2Metadata.value.depends_on) ? v2Metadata.value.depends_on.map(String) : [])
const blockedBy = computed(() => Array.isArray(v2Metadata.value.blocked_by) ? v2Metadata.value.blocked_by.map(String) : [])
const relatedTaskOptions = computed(() => {
  const seen = new Set<string>()
  const options: Array<{ value: string; label: string; context: string }> = []
  for (const list of data.lists) {
    for (const card of list.cards) {
      if (card.cardPath === editor.cardPath) continue
      const fallbackTitle = card.cardName.replace(/\.md$/i, '')
      const title = String(card.frontmatter.title || fallbackTitle).replace(/^#\s*/, '').trim() || fallbackTitle
      if (!title || seen.has(title)) continue
      seen.add(title)
      options.push({ value: title, label: title, context: getListDisplayName(list.listName) || list.listName })
    }
  }
  return options
})
const projection = computed(() => data.snapshot?.v2?.cards.find((card) => card.cardPath === editor.cardPath))
const includedSections = computed(() => new Set((projection.value?.sections || []).filter((section) => section.included === true).map((section) => String(section.name))))
const derivedSignal = computed(() => {
  if (priority.value === 'P0' || priority.value === 'P1' || includedSections.value.has('critical')) return 'Critical'
  if (includedSections.value.has('blocked')) return 'Blocked'
  if (includedSections.value.has('agent_loops')) return 'Agent-ready'
  if (includedSections.value.has('low_hanging_fruit')) return 'Quick win'
  return 'None'
})
const derivedSection = computed(() => {
  if (derivedSignal.value === 'Critical') return 'critical'
  if (derivedSignal.value === 'Blocked') return 'blocked'
  if (derivedSignal.value === 'Agent-ready') return 'agent_loops'
  if (derivedSignal.value === 'Quick win') return 'low_hanging_fruit'
  return ''
})
const whyText = computed(() => {
  const section = projection.value?.sections.find((item) => item.name === derivedSection.value)
  const firstReason = (value: unknown) => Array.isArray(value) ? value[0] : undefined
  const reason = firstReason(section?.reason_codes) || firstReason(projection.value?.eligibility?.reason_codes)
  return String(reason || 'Complete the required work fields to produce a computed signal.').replace(/_/g, ' ').toLowerCase()
})

function label(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function updateV2(nextPartial: Record<string, unknown>) {
  const next = { ...clone(v2Metadata.value), contract_version: 1, ...nextPartial }
  editor.frontmatter = { ...editor.frontmatter, signboard_v2: next }
  editor.queueSave()
}

function updateCore(field: 'kind' | 'work_type' | 'priority_class', value: string) {
  updateV2({ [field]: value })
}

function updateEffort(event: Event) {
  const value = String((event.target as HTMLInputElement).value || '').trim()
  const estimate = clone(v2Metadata.value.estimate)
  if (value) estimate.effort_points = Number(value)
  else delete estimate.effort_points
  updateV2(Object.keys(estimate).length ? { estimate } : { estimate: undefined })
}

function updateDependencies(field: 'depends_on' | 'blocked_by', values: string[]) {
  updateV2({ [field]: values.length ? values : undefined })
}

function readAdvancedValue(group: string, field: string) {
  const values = isObject(v2Metadata.value[group]) ? v2Metadata.value[group] : {}
  const value = values[field]
  return typeof value === 'number' ? value : ''
}

function updateAdvancedValue(group: string, field: string, event: Event) {
  const values = clone(v2Metadata.value[group])
  const raw = String((event.target as HTMLInputElement).value || '').trim()
  if (raw) values[field] = Number(raw)
  else delete values[field]
  updateV2({ [group]: values })
}

function readPolicyValue(field: string) {
  const execution = isObject(v2Metadata.value.execution) ? v2Metadata.value.execution : {}
  return execution[field] === true
}

function updatePolicyValue(field: string, event: Event) {
  const execution = clone(v2Metadata.value.execution)
  execution[field] = (event.target as HTMLInputElement).checked
  updateV2({ execution })
}
</script>

<template>
  <section class="v2-editor-work-details" aria-labelledby="cardEditorWorkDetailsTitle">
    <button id="cardEditorWorkDetailsSummary" class="v2-editor-work-summary" type="button" :aria-expanded="detailsOpen" aria-controls="cardEditorWorkDetailsPanel" @click="detailsOpen = !detailsOpen">
      <span class="v2-editor-work-summary-copy"><span class="v2-editor-eyebrow">V2 work</span><strong id="cardEditorWorkDetailsTitle">{{ label(kind) }} · {{ priority }} · {{ label(workType) }}<template v-if="effort"> · {{ effort }} pts</template></strong></span>
      <span class="v2-editor-work-summary-stage">{{ currentListName }} <FeatherIcon :name="detailsOpen ? 'chevron-up' : 'chevron-down'" :size="15" /></span>
    </button>
    <div v-if="detailsOpen" id="cardEditorWorkDetailsPanel" class="v2-editor-work-panel">
      <div class="v2-editor-core-grid">
        <label>Kind<select :value="kind" @change="updateCore('kind', ($event.target as HTMLSelectElement).value)"><option v-for="option in KIND_OPTIONS" :key="option" :value="option">{{ label(option) }}</option></select></label>
        <label>Work type<select :value="workType" @change="updateCore('work_type', ($event.target as HTMLSelectElement).value)"><option v-for="option in WORK_TYPE_OPTIONS" :key="option" :value="option">{{ label(option) }}</option></select></label>
        <label>Priority<select :value="priority" @change="updateCore('priority_class', ($event.target as HTMLSelectElement).value)"><option v-for="option in PRIORITY_OPTIONS" :key="option" :value="option">{{ option || 'Unset' }}</option></select></label>
        <label>Effort points<input type="number" min="1" max="99" step="1" :value="effort" placeholder="Unset" @change="updateEffort" /></label>
      </div>
      <div class="v2-editor-stage-row"><div class="v2-editor-stage-field"><span class="v2-editor-field-label">Stage</span><CardMoveControls :card-path="editor.cardPath" :list-paths="props.listPaths" :on-move="props.onMove" /></div></div>
      <V2RelatedTaskSelect label="Depends on" :model-value="dependencies" :options="relatedTaskOptions" @update:model-value="updateDependencies('depends_on', $event)" />
      <V2RelatedTaskSelect label="Blocked by" :model-value="blockedBy" :options="relatedTaskOptions" @update:model-value="updateDependencies('blocked_by', $event)" />

      <button class="v2-editor-disclosure" type="button" :aria-expanded="advancedOpen" @click="advancedOpen = !advancedOpen"><span>Advanced scoring</span><FeatherIcon :name="advancedOpen ? 'chevron-up' : 'chevron-down'" :size="14" /></button>
      <div v-if="advancedOpen" class="v2-editor-advanced-grid">
        <label v-for="field in ADVANCED_FIELDS" :key="`${field.group}.${field.field}`">{{ field.label }}<input type="number" :min="field.min" :max="field.max" step="1" :value="readAdvancedValue(field.group, field.field)" @change="updateAdvancedValue(field.group, field.field, $event)" /></label>
        <label v-for="field in POLICY_FIELDS" :key="field.field" class="v2-editor-policy-field"><input type="checkbox" :checked="readPolicyValue(field.field)" @change="updatePolicyValue(field.field, $event)" />{{ field.label }}</label>
      </div>

      <div class="v2-editor-computed" aria-label="Computed signals"><span class="v2-editor-field-label">Computed signals</span><strong>{{ derivedSignal }}</strong><span class="v2-editor-why">{{ whyText }}</span><button v-if="derivedSection && props.onOpenDashboard" type="button" class="v2-editor-dashboard-link" @click="props.onOpenDashboard(derivedSection)">View in Dashboard</button></div>
    </div>
  </section>
</template>

<style scoped>
.v2-editor-work-details { margin: 0 0 14px; border: 1px solid var(--border, #e6e8ec); border-radius: 8px; background: var(--surface, #fff); }
.v2-editor-work-summary { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border: 0; background: transparent; color: inherit; text-align: left; cursor: pointer; }
.v2-editor-work-summary-copy { display: grid; gap: 2px; min-width: 0; }
.v2-editor-eyebrow, .v2-editor-field-label { color: var(--muted, #6b7280); font-size: 10px; letter-spacing: .06em; text-transform: uppercase; }
.v2-editor-work-summary-stage { display: inline-flex; flex: 0 0 auto; align-items: center; gap: 5px; color: var(--muted, #6b7280); font-size: 12px; }
.v2-editor-work-panel { display: grid; gap: 12px; padding: 0 12px 12px; }
.v2-editor-core-grid, .v2-editor-advanced-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.v2-editor-core-grid label, .v2-editor-advanced-grid label, .v2-editor-wide-field { display: grid; gap: 4px; color: var(--muted, #6b7280); font-size: 11px; }
.v2-editor-core-grid select, .v2-editor-core-grid input, .v2-editor-advanced-grid input:not([type="checkbox"]), .v2-editor-wide-field textarea { box-sizing: border-box; width: 100%; min-width: 0; min-height: 32px; height: 32px; padding: 5px 6px; border: 1px solid var(--border, #e6e8ec); border-radius: 5px; background: var(--surface, #fff); color: var(--text, #111827); font: inherit; font-size: 13px; line-height: 1.2; }
.v2-editor-stage-row { display: grid; gap: 4px; padding: 8px 0; border-block: 1px solid var(--border, #e6e8ec); }
.v2-editor-stage-field { display: grid; gap: 4px; }
.v2-editor-stage-field :deep(.cardEditorListControl) { width: 100%; min-width: 0; padding-left: 0; }
.v2-editor-stage-field :deep(.card-editor-stage-select), .v2-editor-stage-field :deep(.card-editor-stage-select select) { width: 100%; min-width: 0; }
.v2-editor-wide-field textarea { resize: vertical; }
.v2-editor-disclosure { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border: 0; border-top: 1px solid var(--border, #e6e8ec); background: transparent; color: inherit; font-weight: 600; text-align: left; cursor: pointer; }
.v2-editor-policy-field { display: flex !important; grid-template-columns: auto 1fr; align-items: center; gap: 6px !important; }
.v2-editor-policy-field input[type="checkbox"] { flex: 0 0 16px; width: 16px; height: 16px; min-width: 16px; min-height: 16px; margin: 0; padding: 0; accent-color: var(--primary, #0b5fff); }
.v2-editor-computed { display: grid; gap: 4px; padding-top: 8px; border-top: 1px solid var(--border, #e6e8ec); }
.v2-editor-why { color: var(--muted, #6b7280); font-size: 12px; }
.v2-editor-dashboard-link { justify-self: start; padding: 0; border: 0; background: transparent; color: var(--primary, #0b5fff); cursor: pointer; font-size: 12px; }
@media (max-width: 580px) { .v2-editor-core-grid, .v2-editor-advanced-grid { grid-template-columns: 1fr; } }
</style>
