<script setup lang="ts">
import { computed } from 'vue'
import { getPlannerSourceTheme } from '../../../lib/planner.js'
import FeatherIcon from '../FeatherIcon.vue'

const props = defineProps<{ entry: any; isoDate: string; className: string; onOpen: (entry: any) => void }>()
const theme = computed(() => getPlannerSourceTheme(props.entry.boardColorScheme))
const sourceText = computed(() => [props.entry.boardDisplayName, props.entry.listDisplayName].filter(Boolean).join(' · '))
const sourceStyle = computed(() => ({
  '--board-source-pill-bg': theme.value.light.background,
  '--board-source-pill-border': theme.value.light.border,
  '--board-source-pill-text': theme.value.light.color,
  '--board-source-pill-bg-dark': theme.value.dark.background,
  '--board-source-pill-border-dark': theme.value.dark.border,
  '--board-source-pill-text-dark': theme.value.dark.color,
}))
</script>

<template>
  <button :class="props.className" type="button" :data-path="props.entry.cardPath" :data-due="props.isoDate" :data-temporal-reason="props.entry.temporalReason" :data-task-line-indexes="props.entry.temporalTaskLineIndexes?.join(',')" data-sb-tooltip-disabled="true" @click.stop="props.onOpen(props.entry)">
    <span class="card-drag-frame board-temporal-card-frame">
      <span class="board-temporal-card-title">{{ props.entry.temporalDisplayTitle || props.entry.title }}</span>
      <span v-if="props.entry.temporalDisplaySubtitle" class="board-temporal-card-context">{{ props.entry.temporalDisplaySubtitle }}</span>
      <span class="board-temporal-card-footer">
        <span v-if="sourceText" class="board-temporal-card-list board-temporal-card-source has-board-source-theme" :data-board-color-scheme="props.entry.boardColorScheme" :style="sourceStyle" :title="`In ${props.entry.listDisplayName} on ${props.entry.boardDisplayName}`">{{ sourceText }}</span>
        <span v-if="props.entry.taskSummary?.total" class="task-progress-badge board-temporal-task-progress" :aria-label="`${props.entry.taskSummary.completed}/${props.entry.taskSummary.total} tasks completed`"><FeatherIcon name="check-square" />{{ props.entry.taskSummary.completed }}/{{ props.entry.taskSummary.total }}</span>
      </span>
    </span>
  </button>
</template>
