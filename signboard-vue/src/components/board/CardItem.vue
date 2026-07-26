<script setup lang="ts">
import { computed } from 'vue'
import { getFrontmatterLinkedObjectCount } from '../../../lib/linkedObjects.js'
import type { BoardLabel, CardSnapshot } from '../../types'
import FeatherIcon from '../FeatherIcon.vue'
import LabelChips from './LabelChips.vue'

const props = withDefaults(defineProps<{ card: CardSnapshot; labels: BoardLabel[]; isVisible?: boolean; onOpen?: (path: string) => void; onArchive?: (path: string) => void; onLabelsChanged?: () => void }>(), { isVisible: true })
const frontmatter = computed(() => props.card.frontmatter || {})
const title = computed(() => String(frontmatter.value.title || '').replace('# ', '') || 'Untitled')
const labelIds = computed(() => Array.isArray(frontmatter.value.labels) ? frontmatter.value.labels.map(String) : [])
const linkedCount = computed(() => getFrontmatterLinkedObjectCount(frontmatter.value))
const preview = computed(() => props.card.body.split(/\r?\n/).find((line) => line.trim()) || '')
const startDate = computed(() => String(frontmatter.value.start || '').trim())
const dueDate = computed(() => String(frontmatter.value.due || '').trim())

function dateLabel(value: string) {
  if (!value) return ''
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(parsed)
}
const dates = computed(() => {
  const start = dateLabel(startDate.value)
  const due = dateLabel(dueDate.value)
  if (start && due) return start === due ? due : `${start} – ${due}`
  if (start) return `Starts ${start}`
  if (due) return `Due ${due}`
  return ''
})
</script>

<template>
  <div class="card" :class="{ 'card-filtered-out': !props.isVisible }" :data-path="card.cardPath" role="listitem">
    <div class="card-drag-frame">
      <button class="card-archive-button" type="button" title="Archive card" aria-label="Archive card" @click.stop="props.onArchive?.(card.cardPath)"><FeatherIcon name="archive" /></button>
      <h3><button class="card-title-button" type="button" :aria-label="`Open card: ${title}`" @click="props.onOpen?.(card.cardPath)">{{ title }}</button></h3>
      <div class="card-body"><p>{{ preview.length > 50 ? `${preview.slice(0, 35)}...` : preview }}</p>
        <div class="metadata">
          <button v-if="dates" class="metadata-action card-date-action" type="button" disabled :aria-label="`Dates ${dates}`"><FeatherIcon name="calendar" /><span class="card-date-label">{{ dates }}</span></button>
          <span v-if="card.taskSummary.total" class="task-progress-badge metadata-action task-progress-badge-inline" :class="{ 'task-progress-badge-complete': card.taskSummary.completed >= card.taskSummary.total }" :aria-label="`${card.taskSummary.completed}/${card.taskSummary.total} tasks completed`"><FeatherIcon name="check-square" /><span class="task-progress-badge-text">{{ card.taskSummary.completed }}/{{ card.taskSummary.total }}</span></span>
          <span v-if="linkedCount" class="linked-objects-badge metadata-action linked-objects-badge-inline" :aria-label="`${linkedCount} linked object${linkedCount === 1 ? '' : 's'}`"><span class="linked-objects-badge-icon"><FeatherIcon name="paperclip" /></span><span class="linked-objects-badge-text">{{ linkedCount }}</span></span>
          <LabelChips :card-path="card.cardPath" :label-ids="labelIds" :labels="labels" :on-changed="props.onLabelsChanged" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-drag-frame { position: relative; }
.card-archive-button {
  position: absolute;
  top: 8px;
  right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--muted);
  opacity: 0;
  box-shadow: none;
}
.card:hover .card-archive-button, .card:focus-within .card-archive-button, .card-archive-button:focus-visible { opacity: 1; }
.card-archive-button:hover { background: color-mix(in oklab, var(--bg-card) 82%, var(--border)); }
.card-archive-button :deep(svg) { width: 14px; height: 14px; }
</style>
