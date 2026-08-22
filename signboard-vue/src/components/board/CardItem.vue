<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getFrontmatterLinkedObjectCount } from '../../../lib/linkedObjects.js'
import { getCardBodyPreviewText } from '../../lib/cardPreview'
import { useLabelsStore } from '../../stores/useLabelsStore'
import { useBoardDataStore } from '../../stores/useBoardDataStore'
import type { BoardLabel, CardSnapshot } from '../../types'
import FeatherIcon from '../FeatherIcon.vue'
import V2SignalChip from './V2SignalChip.vue'
import { getCardDisplayTitle } from '../../../lib/cardTitle.js'

const props = withDefaults(defineProps<{ card: CardSnapshot; labels?: BoardLabel[]; isVisible?: boolean; presentationOnly?: boolean; onOpen?: (path: string) => void; onArchive?: (path: string) => void; onDuplicate?: (path: string) => void }>(), { isVisible: true, presentationOnly: false, labels: () => [] })
const labelsStore = useLabelsStore()
const boardData = useBoardDataStore()
const frontmatter = computed(() => props.card.frontmatter || {})
const title = computed(() => props.card.displayTitle || getCardDisplayTitle(frontmatter.value.title, props.card.cardName))
const cardLabels = computed(() => readCardLabelIds(frontmatter.value.labels).map((id) => props.labels.find((label) => label.id === id) || { id, name: 'Unknown label' }))
const visibleCardLabels = computed(() => cardLabels.value.slice(0, 2))
const additionalCardLabelCount = computed(() => Math.max(0, cardLabels.value.length - visibleCardLabels.value.length))
const linkedCount = computed(() => getFrontmatterLinkedObjectCount(frontmatter.value))
const preview = computed(() => getCardBodyPreviewText(props.card.body))
const startDate = computed(() => String(frontmatter.value.start || '').trim())
const dueDate = computed(() => String(frontmatter.value.due || '').trim())
const v2Projection = computed(() => props.card.v2)
const v2Metadata = computed<Record<string, unknown>>(() => isObject(frontmatter.value.signboard_v2) ? frontmatter.value.signboard_v2 as Record<string, unknown> : {})
const v2Display = computed(() => boardData.snapshot?.v2?.profile?.cardDisplay || {})
const v2ProfileEnabled = computed(() => boardData.snapshot?.v2?.profile?.enabled === true)
const v2WorkSignalVisible = computed(() => v2ProfileEnabled.value && v2Projection.value?.metadata?.present === true && v2Projection.value?.metadata?.valid === true && v2Display.value.showSignals !== false)
const v2Kind = computed(() => String(v2Metadata.value.kind || '').trim())
const v2Priority = computed(() => String(v2Metadata.value.priority_class || '').trim().toUpperCase())
const v2Blocked = computed(() => {
  if (!v2WorkSignalVisible.value) return false
  const status = String(v2Projection.value?.normalized?.status || '').trim().toLowerCase()
  const blockedBy = Array.isArray(v2Metadata.value.blocked_by) && v2Metadata.value.blocked_by.length > 0
  return status === 'blocked' || blockedBy || v2Metadata.value.blocked_on_decision === true
})
const v2DerivedBadge = computed(() => {
  if (!v2WorkSignalVisible.value || v2Display.value.showDerivedBadges === false) return ''
  const sections = Array.isArray(v2Projection.value?.sections) ? v2Projection.value.sections : []
  const included = (name: string) => sections.some((section) => isObject(section) && section.name === name && section.included === true)
  if (included('blocked')) return 'Blocked'
  if (included('low_hanging_fruit')) return 'Quick win'
  return ''
})
const v2DerivedBadgeIcon = computed(() => ({
  Blocked: 'pause-circle',
  'Quick win': 'zap',
} as Record<string, string>)[v2DerivedBadge.value] || '')
const CARD_CLICK_DRAG_TOLERANCE_PX = 6

let pointerState: { pointerId: number | null; clientX: number; clientY: number; moved: boolean } | null = null
let suppressNextClick = false
let suppressClickTimer: number | null = null
const contextMenu = ref<HTMLElement | null>(null)
const contextMenuPosition = ref({ left: 0, top: 0 })
const contextMenuOpen = ref(false)
const contextLabelIds = ref<string[]>([])
let contextMenuRestoreTarget: HTMLElement | null = null

function readCardLabelIds(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : []
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function displayV2Value(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function syncContextLabelIds() {
  contextLabelIds.value = readCardLabelIds(frontmatter.value.labels)
}

watch(() => frontmatter.value.labels, syncContextLabelIds, { deep: true, immediate: true })

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

function openCard() {
  props.onOpen?.(props.card.cardPath)
}

function isNonCardActivationTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('button:not(.card-title-button), a, input, select, textarea, [contenteditable="true"], [contenteditable="plaintext-only"], .card-label-chip:not(.card-label-chip-inline)'))
}

function handlePointerDown(event: PointerEvent) {
  if (props.presentationOnly) return
  if (event.isPrimary === false || (typeof event.button === 'number' && event.button !== 0) || isNonCardActivationTarget(event.target)) return
  pointerState = {
    pointerId: typeof event.pointerId === 'number' ? event.pointerId : null,
    clientX: event.clientX,
    clientY: event.clientY,
    moved: false,
  }
}

function handlePointerMove(event: PointerEvent) {
  if (!pointerState || (pointerState.pointerId !== null && event.pointerId !== pointerState.pointerId)) return
  if (Math.hypot(event.clientX - pointerState.clientX, event.clientY - pointerState.clientY) > CARD_CLICK_DRAG_TOLERANCE_PX) {
    pointerState.moved = true
  }
}

function handlePointerUp(event: PointerEvent) {
  if (!pointerState || (pointerState.pointerId !== null && event.pointerId !== pointerState.pointerId)) return
  const moved = pointerState.moved || Math.hypot(event.clientX - pointerState.clientX, event.clientY - pointerState.clientY) > CARD_CLICK_DRAG_TOLERANCE_PX
  pointerState = null
  if (!moved) return

  suppressNextClick = true
  if (suppressClickTimer !== null) window.clearTimeout(suppressClickTimer)
  suppressClickTimer = window.setTimeout(() => {
    suppressNextClick = false
    suppressClickTimer = null
  }, 0)
}

function handlePointerCancel() {
  pointerState = null
}

function handleCardClick() {
  if (props.presentationOnly) return
  if (suppressNextClick) {
    suppressNextClick = false
    if (suppressClickTimer !== null) {
      window.clearTimeout(suppressClickTimer)
      suppressClickTimer = null
    }
    return
  }
  openCard()
}

function isNativeContextMenuTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('.card-labels, .card-label-chip:not(.card-label-chip-inline), .card-archive-button, .metadata-action, input, select, textarea, [contenteditable="true"], [contenteditable="plaintext-only"]'))
}

function positionContextMenu() {
  if (!contextMenu.value) return
  const rect = contextMenu.value.getBoundingClientRect()
  const padding = 8
  contextMenuPosition.value = {
    left: Math.max(padding, Math.min(contextMenuPosition.value.left, window.innerWidth - rect.width - padding)),
    top: Math.max(padding, Math.min(contextMenuPosition.value.top, window.innerHeight - rect.height - padding)),
  }
}

function openContextMenu(event: MouseEvent) {
  if (props.presentationOnly) return
  if (isNativeContextMenuTarget(event.target)) return
  event.preventDefault()
  event.stopPropagation()
  contextMenuRestoreTarget = document.activeElement instanceof HTMLElement ? document.activeElement : null
  contextMenuPosition.value = { left: event.clientX, top: event.clientY }
  contextMenuOpen.value = true
  void nextTick(() => {
    positionContextMenu()
    contextMenu.value?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
  })
}

function closeContextMenu() {
  if (!contextMenuOpen.value) return
  contextMenuOpen.value = false
  const restoreTarget = contextMenuRestoreTarget
  contextMenuRestoreTarget = null
  void nextTick(() => restoreTarget?.focus({ preventScroll: true }))
}

function archiveFromContextMenu() {
  closeContextMenu()
  props.onArchive?.(props.card.cardPath)
}

function duplicateFromContextMenu() {
  closeContextMenu()
  props.onDuplicate?.(props.card.cardPath)
}

async function toggleContextLabel(label: BoardLabel) {
  const current = contextLabelIds.value
  const next = current.includes(label.id) ? current.filter((id) => id !== label.id) : [...current, label.id]
  contextLabelIds.value = next
  closeContextMenu()
  try {
    await labelsStore.updateCardLabels(props.card.cardPath, next)
  } catch (error) {
    contextLabelIds.value = current
    console.error('Failed to update card labels.', error)
  }
}

function contextLabelIsActive(label: BoardLabel) {
  return contextLabelIds.value.includes(label.id)
}

function handleContextMenuPointerDown(event: PointerEvent) {
  if (!contextMenuOpen.value || contextMenu.value?.contains(event.target as Node)) return
  closeContextMenu()
}

function handleContextMenuKeydown(event: KeyboardEvent) {
  if (!contextMenuOpen.value || !contextMenu.value) return
  if (event.key === 'Escape') {
    event.preventDefault()
    closeContextMenu()
    return
  }
  const items = Array.from(contextMenu.value.querySelectorAll<HTMLButtonElement>('[role="menuitem"], [role="menuitemcheckbox"]'))
  if (event.key === 'Home' || event.key === 'ArrowUp' || event.key === 'End' || event.key === 'ArrowDown') {
    event.preventDefault()
    const nextIndex = event.key === 'Home' || event.key === 'ArrowUp' ? 0 : items.length - 1
    items[nextIndex]?.focus()
  }
}

onMounted(() => {
  if (props.presentationOnly) return
  document.addEventListener('pointermove', handlePointerMove, true)
  document.addEventListener('pointerup', handlePointerUp, true)
  document.addEventListener('pointercancel', handlePointerCancel, true)
  document.addEventListener('pointerdown', handleContextMenuPointerDown, true)
  document.addEventListener('keydown', handleContextMenuKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointermove', handlePointerMove, true)
  document.removeEventListener('pointerup', handlePointerUp, true)
  document.removeEventListener('pointercancel', handlePointerCancel, true)
  document.removeEventListener('pointerdown', handleContextMenuPointerDown, true)
  document.removeEventListener('keydown', handleContextMenuKeydown)
  if (suppressClickTimer !== null) window.clearTimeout(suppressClickTimer)
  contextMenuOpen.value = false
  contextMenuRestoreTarget = null
  pointerState = null
  suppressNextClick = false
  suppressClickTimer = null
})
</script>

<template>
  <div class="card" :class="{ 'card-filtered-out': !props.isVisible, 'card-presentation-only': props.presentationOnly, 'card-blocked': v2Blocked }" :data-path="card.cardPath" :role="props.presentationOnly ? 'presentation' : 'listitem'" @pointerdown.capture="handlePointerDown" @click="handleCardClick" @contextmenu="openContextMenu">
    <div class="card-drag-frame">
      <h3><span v-if="props.presentationOnly" class="card-title-button">{{ title }}</span><button v-else class="card-title-button" type="button" :aria-label="`Open card: ${title}`">{{ title }}</button></h3>
      <div class="card-body"><p v-if="preview" class="card-body-preview">{{ preview }}</p>
        <div class="metadata">
          <span v-if="cardLabels.length" class="card-labels-inline">
            <span v-for="label in visibleCardLabels" :key="label.id" class="card-label-chip card-label-chip-inline" :class="{ 'card-label-chip-unknown': label.name === 'Unknown label' }" :style="label.name === 'Unknown label' ? undefined : { backgroundColor: `${label.colorLight || '#94a3b8'}22`, borderColor: label.colorLight || '#94a3b8' }" :title="label.name">{{ label.name }}</span>
            <span v-if="additionalCardLabelCount" class="card-label-chip card-label-chip-inline card-label-chip-more" :aria-label="`Plus ${additionalCardLabelCount} more label${additionalCardLabelCount === 1 ? '' : 's'}`">+{{ additionalCardLabelCount }} more</span>
          </span>
          <span v-if="v2WorkSignalVisible" class="card-v2-signals" :class="`card-v2-signals-${v2Display.density === 'standard' ? 'standard' : 'compact'}`" aria-label="V2 work signals">
            <V2SignalChip v-if="v2Kind && v2Kind.toLowerCase() !== 'task'" :label="displayV2Value(v2Kind)" icon="tag" tone="kind" :density="v2Display.density === 'standard' ? 'standard' : 'compact'" />
            <V2SignalChip v-if="v2Priority" :label="v2Priority" icon="flag" tone="priority" :density="v2Display.density === 'standard' ? 'standard' : 'compact'" />
            <V2SignalChip v-if="v2DerivedBadge" :label="v2DerivedBadge" :icon="v2DerivedBadgeIcon" tone="derived" :density="v2Display.density === 'standard' ? 'standard' : 'compact'" />
          </span>
          <button v-if="dates" class="metadata-action card-date-action" type="button" disabled :aria-label="`Dates ${dates}`"><FeatherIcon name="calendar" /><span class="card-date-label">{{ dates }}</span></button>
          <span v-if="card.taskSummary.total" class="task-progress-badge metadata-action task-progress-badge-inline" :class="{ 'task-progress-badge-complete': card.taskSummary.completed >= card.taskSummary.total }" :aria-label="`${card.taskSummary.completed}/${card.taskSummary.total} tasks completed`"><FeatherIcon name="check-square" /><span class="task-progress-badge-text">{{ card.taskSummary.completed }}/{{ card.taskSummary.total }}</span></span>
          <span v-if="linkedCount" class="linked-objects-badge metadata-action linked-objects-badge-inline" :aria-label="`${linkedCount} linked object${linkedCount === 1 ? '' : 's'}`"><span class="linked-objects-badge-icon"><FeatherIcon name="paperclip" /></span><span class="linked-objects-badge-text">{{ linkedCount }}</span></span>
        </div>
      </div>
    </div>
    <Teleport v-if="!props.presentationOnly" to="body">
      <div v-if="contextMenuOpen" ref="contextMenu" class="card-context-menu label-popover" role="menu" aria-label="Actions" :style="{ left: `${contextMenuPosition.left}px`, top: `${contextMenuPosition.top}px` }" @contextmenu.prevent.stop>
        <button class="list-actions-option" type="button" role="menuitem" @click="duplicateFromContextMenu"><FeatherIcon name="copy" /><span class="list-actions-option-label">Duplicate</span></button>
        <div class="label-popover-separator" aria-hidden="true" />
        <section class="card-context-menu-label-section" aria-labelledby="cardContextMenuLabelsHeading">
          <h4 id="cardContextMenuLabelsHeading" class="card-context-menu-section-heading">Labels</h4>
          <div v-if="props.labels.length" class="card-context-menu-labels" role="group" aria-label="Labels">
            <button v-for="label in props.labels" :key="label.id" class="list-actions-option card-context-menu-label-option" type="button" role="menuitemcheckbox" :aria-checked="contextLabelIsActive(label)" @click="toggleContextLabel(label)"><span class="label-color-swatch" :style="{ backgroundColor: label.colorLight || '#3b82f6' }" /><span class="list-actions-option-label">{{ label.name }}</span><FeatherIcon v-if="contextLabelIsActive(label)" name="check" :size="14" /></button>
          </div>
          <p v-else class="label-popover-empty card-context-menu-label-empty">No labels yet.</p>
        </section>
        <div class="label-popover-separator" aria-hidden="true" />
        <button class="list-actions-option list-actions-option-destructive" type="button" role="menuitem" @click="archiveFromContextMenu"><FeatherIcon name="archive" /><span class="list-actions-option-label">Archive</span></button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.card-drag-frame { position: relative; }
.card-v2-signals { display: inline-flex; align-items: center; gap: 4px; max-width: 100%; }
.card-v2-signals-standard { gap: 6px; }
</style>
