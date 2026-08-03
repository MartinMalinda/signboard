<script setup lang="ts">
import { computed } from 'vue'
import { V2_DASHBOARD_SECTION_OPTIONS, V2_STAGE_OPTIONS, useSettingsStore } from '../../stores/useSettingsStore'

const settings = useSettingsStore()
const sections = computed(() => Array.isArray(settings.v2Profile.dashboard?.sections) ? settings.v2Profile.dashboard.sections : V2_DASHBOARD_SECTION_OPTIONS.map((section) => section.id))
const cardDisplay = computed(() => settings.v2Profile.cardDisplay || {})

function sectionEnabled(id: string) { return sections.value.includes(id) }
async function toggleSection(id: string, enabled: boolean) {
  await settings.setV2DashboardSections(enabled ? [...sections.value, id] : sections.value.filter((section) => section !== id))
}
async function moveSection(id: string, direction: -1 | 1) {
  const next = [...sections.value]
  const index = next.indexOf(id)
  const target = index + direction
  if (index < 0 || target < 0 || target >= next.length) return
  const [section] = next.splice(index, 1)
  if (section) next.splice(target, 0, section)
  await settings.setV2DashboardSections(next)
}
function stageList(stage: string) {
  const value = settings.v2Profile.stages?.[stage as keyof NonNullable<typeof settings.v2Profile.stages>]
  return Array.isArray(value) ? String(value[0] || '') : ''
}
function displayLabel(value: string) { return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase()) }
</script>

<template>
  <section id="boardSettingsPanelProject" class="boardSettingsSection board-settings-panel" :class="{ 'is-active': settings.activePanel === 'project' }" role="tabpanel" :aria-hidden="settings.activePanel === 'project' ? 'false' : 'true'" aria-labelledby="boardSettingsNavProject" data-settings-panel="project">
    <h3>Project</h3>
    <p class="boardSettingsHint">V2 adds product-development signals on top of the board’s existing lists. Scores and badges are derived by the shared evaluator; they are not hand-edited here.</p>
    <div class="board-settings-group">
      <div class="board-settings-toggle-row"><div><p class="boardSettingsHint boardSettingsHintTight">Use product workspace</p><p class="boardSettingsHint">Enable the V2 profile for this board. Turning it off restores the existing board presentation.</p></div><label class="board-settings-switch" for="boardSettingsV2EnabledToggle"><input id="boardSettingsV2EnabledToggle" type="checkbox" role="switch" aria-label="Use product workspace" :checked="settings.v2Profile.enabled === true" @change="settings.setV2({ enabled: ($event.target as HTMLInputElement).checked })"><span class="board-settings-switch-track" aria-hidden="true" /></label></div>
    </div>
    <div class="board-settings-group"><label for="boardSettingsV2ProfileId">Profile name</label><input id="boardSettingsV2ProfileId" type="text" :value="settings.v2Profile.profileId || ''" placeholder="default-product" @change="settings.setV2({ profileId: ($event.target as HTMLInputElement).value })"><p class="boardSettingsHint">The profile name is stored with this board and can identify a future project-specific contract.</p></div>
    <div class="board-settings-group"><h4 class="board-settings-subheading">Dashboard sections</h4><p class="boardSettingsHint">Choose which computed sections appear and use the arrows to set their order.</p><div class="board-settings-v2-section-list"><div v-for="section in V2_DASHBOARD_SECTION_OPTIONS" :key="section.id" class="board-settings-v2-section-row"><label><input type="checkbox" :checked="sectionEnabled(section.id)" @change="toggleSection(section.id, ($event.target as HTMLInputElement).checked)"><span><strong>{{ section.label }}</strong><small>{{ section.description }}</small></span></label><span class="board-settings-v2-order-actions"><button type="button" :disabled="!sectionEnabled(section.id) || sections.indexOf(section.id) === 0" :aria-label="`Move ${section.label} up`" @click="moveSection(section.id, -1)">↑</button><button type="button" :disabled="!sectionEnabled(section.id) || sections.indexOf(section.id) === sections.length - 1" :aria-label="`Move ${section.label} down`" @click="moveSection(section.id, 1)">↓</button></span></div></div></div>
    <div class="board-settings-group"><h4 class="board-settings-subheading">Card display</h4><div class="board-settings-toggle-row"><div><p class="boardSettingsHint boardSettingsHintTight">Show V2 work signals on Kanban cards</p><p class="boardSettingsHint">Keep the compact kind, priority, and computed badge row visible.</p></div><label class="board-settings-switch" for="boardSettingsV2SignalsToggle"><input id="boardSettingsV2SignalsToggle" type="checkbox" role="switch" aria-label="Show V2 work signals on Kanban cards" :checked="cardDisplay.showSignals !== false" @change="settings.setV2CardDisplay({ showSignals: ($event.target as HTMLInputElement).checked })"><span class="board-settings-switch-track" aria-hidden="true" /></label></div><div class="board-settings-toggle-row"><div><p class="boardSettingsHint boardSettingsHintTight">Show computed badges</p><p class="boardSettingsHint">Derived badges remain read-only and explainable.</p></div><label class="board-settings-switch" for="boardSettingsV2BadgesToggle"><input id="boardSettingsV2BadgesToggle" type="checkbox" role="switch" aria-label="Show computed badges" :checked="cardDisplay.showDerivedBadges !== false" @change="settings.setV2CardDisplay({ showDerivedBadges: ($event.target as HTMLInputElement).checked })"><span class="board-settings-switch-track" aria-hidden="true" /></label></div><label for="boardSettingsV2Density">Signal density<select id="boardSettingsV2Density" :value="cardDisplay.density || 'compact'" @change="settings.setV2CardDisplay({ density: ($event.target as HTMLSelectElement).value })"><option value="compact">Compact</option><option value="standard">Standard</option></select></label></div>
    <div class="board-settings-group"><h4 class="board-settings-subheading">New card defaults</h4><div class="board-settings-v2-grid"><label for="boardSettingsV2DefaultKind">Kind<select id="boardSettingsV2DefaultKind" :value="settings.v2Profile.cardDefaults?.kind || 'task'" @change="settings.setV2Defaults({ kind: ($event.target as HTMLSelectElement).value })"><option value="task">Task</option><option value="discovery">Discovery</option><option value="epic">Epic</option><option value="incident">Incident</option></select></label><label for="boardSettingsV2DefaultWorkType">Work type<select id="boardSettingsV2DefaultWorkType" :value="settings.v2Profile.cardDefaults?.workType || 'product'" @change="settings.setV2Defaults({ workType: ($event.target as HTMLSelectElement).value })"><option value="product">Product</option><option value="ux">UX</option><option value="engineering_health">Engineering health</option><option value="discovery">Discovery</option><option value="documentation">Documentation</option></select></label><label for="boardSettingsV2DefaultPriority">Priority<select id="boardSettingsV2DefaultPriority" :value="settings.v2Profile.cardDefaults?.priorityClass || 'P2'" @change="settings.setV2Defaults({ priorityClass: ($event.target as HTMLSelectElement).value })"><option value="P0">P0</option><option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option></select></label></div></div>
    <div class="board-settings-group"><h4 class="board-settings-subheading">Stage mapping</h4><p class="boardSettingsHint">Map framework roles to this board’s existing list folders. Custom list names are valid.</p><div class="board-settings-v2-grid"><label v-for="stage in V2_STAGE_OPTIONS" :key="stage.id" :for="`boardSettingsV2Stage-${stage.id}`">{{ stage.label }}<select :id="`boardSettingsV2Stage-${stage.id}`" :value="stageList(stage.id)" @change="settings.setV2Stage(stage.id, ($event.target as HTMLSelectElement).value)"><option value="">Not mapped</option><option v-for="listName in settings.listNames" :key="listName" :value="listName">{{ listName }}</option></select></label></div></div>
  </section>
</template>

<style scoped>
.board-settings-v2-section-list { display: grid; gap: 8px; }
.board-settings-v2-section-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 10px; border: 1px solid var(--border); border-radius: var(--radius); background: color-mix(in oklab, var(--bg-card) 95%, var(--border)); }
.board-settings-v2-section-row > label { display: flex; align-items: flex-start; gap: 9px; min-width: 0; margin: 0; color: var(--text); text-transform: none; letter-spacing: 0; }
.board-settings-v2-section-row label span { display: grid; gap: 2px; }
.board-settings-v2-section-row small { color: var(--muted); font-size: var(--font-sm); }
.board-settings-v2-order-actions { display: inline-flex; gap: 4px; }
.board-settings-v2-order-actions button { width: 28px; min-width: 28px; height: 28px; padding: 0; }
.board-settings-v2-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.board-settings-v2-grid label { display: grid; gap: 5px; color: var(--muted); font-size: var(--font-sm); }
.board-settings-v2-grid select, #boardSettingsPanelProject > .board-settings-group > label > select { min-height: 34px; padding: 5px 8px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-card); color: var(--text); font: inherit; }
@media (max-width: 620px) { .board-settings-v2-grid { grid-template-columns: 1fr; } }
</style>
