<script setup lang="ts">
import FeatherIcon from './FeatherIcon.vue'
import { getShortcutAriaKeyshortcuts } from '../../lib/shortcutLabels.js'

type WorkspaceView = 'planner' | 'kanban' | 'table'

const props = defineProps<{ activeView?: WorkspaceView; onChange?: (view: WorkspaceView) => void }>()

function choose(view: WorkspaceView) {
  props.onChange?.(view)
}
</script>

<template>
  <nav id="workspaceViewDock" class="workspace-view-dock" aria-label="Workspace views">
    <button id="workspaceViewKanban" class="workspace-view-dock-button" :class="{ 'is-primary': props.activeView === 'kanban', 'is-active': props.activeView === 'kanban' }" type="button" data-workspace-view="kanban" title="Show Kanban view" aria-label="Show Kanban view" :aria-current="props.activeView === 'kanban' ? 'page' : undefined" :aria-keyshortcuts="getShortcutAriaKeyshortcuts('kanbanView')" @click="choose('kanban')"><FeatherIcon name="columns" />Kanban</button>
    <button id="workspaceViewTable" class="workspace-view-dock-button" :class="{ 'is-primary': props.activeView === 'table', 'is-active': props.activeView === 'table' }" type="button" data-workspace-view="table" title="Show Table view" aria-label="Show Table view" :aria-current="props.activeView === 'table' ? 'page' : undefined" :aria-keyshortcuts="getShortcutAriaKeyshortcuts('tableView')" @click="choose('table')"><FeatherIcon name="list" />Table</button>
  </nav>
</template>
