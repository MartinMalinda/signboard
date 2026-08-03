<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getFrontmatterLinkedObjectCount } from '../../../lib/linkedObjects.js'
import { getCardBodyPreviewText } from '../../lib/cardPreview'
import { useLabelsStore } from '../../stores/useLabelsStore'
import { useBoardDataStore } from '../../stores/useBoardDataStore'
import type { BoardLabel, CardSnapshot } from '../../types'
import FeatherIcon from '../FeatherIcon.vue'
import AppPopover from '../../lib/components/AppPopover.vue'

const props = withDefaults(defineProps<{ card: CardSnapshot; labels?: BoardLabel[]; isVisible?: boolean; onOpen?: (path: string) => void; onArchive?: (path: string) => void; onDuplicate?: (path: string) => void }>(), { isVisible: true, labels: () => [] })
const labelsStore = useLabelsStore()
const boardData = useBoardDataStore()
const frontmatter = computed(() => props.card.frontmatter || {})
const localV2Metadata = ref<Record<string, unknown> | null>(null)
const title = computed(() => String(frontmatter.value.title || '').replace('# ', '') || 'Untitled')
const cardLabels = computed(() => readCardLabelIds(frontmatter.value.labels).map((id) => props.labels.find((label) => label.id === id) || { id, name: 'Unknown label' }))
const visibleCardLabels = computed(() => cardLabels.value.slice(0, 2))
const additionalCardLabelCount = computed(() => Math.max(0, cardLabels.value.length - visibleCardLabels.value.length))
const linkedCount = computed(() => getFrontmatterLinkedObjectCount(frontmatter.value))
const preview = computed(() => getCardBodyPreviewText(props.card.body))
const startDate = computed(() => String(frontmatter.value.start || '').trim())
const dueDate = computed(() => String(frontmatter.value.due || '').trim())
const v2Projection = computed(() => props.card.v2)
const v2Metadata = computed<Record<string, unknown>>(() => localV2Metadata.value || (isObject(frontmatter.value.signboard_v2) ? frontmatter.value.signboard_v2 as Record<string, unknown> : {}))
const v2Display = computed(() => boardData.snapshot?.v2?.profile?.cardDisplay || {})
const v2ProfileEnabled = computed(() => boardData.snapshot?.v2?.profile?.enabled === true)
const v2WorkSignalVisible = computed(() => v2ProfileEnabled.value && v2Projection.value?.metadata?.present === true && v2Projection.value?.metadata?.valid === true && v2Display.value.showSignals !== false)
const v2Kind = computed(() => String(v2Metadata.value.kind || '').trim())
const v2WorkType = computed(() => String(v2Metadata.value.work_type || '').trim())
const v2Priority = computed(() => String(v2Metadata.value.priority_class || '').trim().toUpperCase())
const v2Effort = computed(() => {
  const estimate = isObject(v2Metadata.value.estimate) ? v2Metadata.value.estimate : {}
  return typeof estimate.effort_points === 'number' ? String(estimate.effort_points) : ''
})
const v2DerivedBadge = computed(() => {
  if (!v2WorkSignalVisible.value || v2Display.value.showDerivedBadges === false) return ''
  const sections = Array.isArray(v2Projection.value?.sections) ? v2Projection.value.sections : []
  const included = (name: string) => sections.some((section) => isObject(section) && section.name === name && section.included === true)
  if (v2Priority.value === 'P0' || v2Priority.value === 'P1' || included('critical')) return 'Critical'
  if (included('blocked')) return 'Blocked'
  if (included('agent_loops')) return 'Agent-ready'
  if (included('low_hanging_fruit')) return 'Quick win'
  return ''
})
const v2PopoverOpen = ref(false)
const v2PopoverOpener = ref<HTMLElement | null>(null)
const v2Saving = ref(false)
const v2SaveError = ref('')
const CARD_CLICK_DRAG_TOLERANCE_PX = 6

const V2_KIND_OPTIONS = ['task', 'discovery', 'epic', 'incident']
const V2_WORK_TYPE_OPTIONS = ['product', 'ux', 'security', 'correctness', 'data_integrity', 'reliability', 'performance', 'compliance', 'privacy', 'engineering_health', 'technical_debt', 'observability', 'operations', 'enablement', 'discovery', 'documentation']
const V2_PRIORITY_OPTIONS = ['', 'P0', 'P1', 'P2', 'P3']
const V2_EFFORT_OPTIONS = ['', '1', '2', '3', '4', '5', '6', '7', '8']

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

function selectValue(event: Event) {
  return (event.target as HTMLSelectElement).value
}

function openV2Popover(event: MouseEvent) {
  event.stopPropagation()
  v2PopoverOpener.value = event.currentTarget as HTMLElement
  v2SaveError.value = ''
  v2PopoverOpen.value = true
}

function closeV2Popover() {
  v2PopoverOpen.value = false
  v2PopoverOpener.value = null
}

function openMoreV2Details() {
  closeV2Popover()
  openCard()
}

async function saveV2Field(field: 'kind' | 'work_type' | 'priority_class' | 'effort_points', value: string) {
  if (v2Saving.value || !window.board.updateFrontmatter) return
  const current = isObject(v2Metadata.value) ? v2Metadata.value : {}
  const next: Record<string, unknown> = { ...current, contract_version: 1 }
  if (field === 'effort_points') {
    const estimate = isObject(next.estimate) ? { ...next.estimate } : {}
    if (value) estimate.effort_points = Number(value)
    else delete estimate.effort_points
    if (Object.keys(estimate).length) next.estimate = estimate
    else delete next.estimate
  } else {
    next[field] = value
  }

  v2Saving.value = true
  v2SaveError.value = ''
  try {
    const result = await window.board.updateFrontmatter(props.card.cardPath, { signboard_v2: next })
    localV2Metadata.value = isObject(result?.signboard_v2) ? result.signboard_v2 : next
  } catch (error) {
    v2SaveError.value = 'Unable to save work details.'
    console.error('Failed to update V2 card metadata.', error)
  } finally {
    v2Saving.value = false
  }
}

watch(() => props.card.cardPath, () => { localV2Metadata.value = null })

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
  <div class="card" :class="{ 'card-filtered-out': !props.isVisible }" :data-path="card.cardPath" role="listitem" @pointerdown.capture="handlePointerDown" @click="handleCardClick" @contextmenu="openContextMenu">
    <div class="card-drag-frame">
      <h3><button class="card-title-button" type="button" :aria-label="`Open card: ${title}`">{{ title }}</button></h3>
      <div class="card-body"><p v-if="preview" class="card-body-preview">{{ preview }}</p>
        <div class="metadata">
          <span v-if="cardLabels.length" class="card-labels-inline">
            <span v-for="label in visibleCardLabels" :key="label.id" class="card-label-chip card-label-chip-inline" :class="{ 'card-label-chip-unknown': label.name === 'Unknown label' }" :style="label.name === 'Unknown label' ? undefined : { backgroundColor: `${label.colorLight || '#94a3b8'}22`, borderColor: label.colorLight || '#94a3b8' }" :title="label.name">{{ label.name }}</span>
            <span v-if="additionalCardLabelCount" class="card-label-chip card-label-chip-inline card-label-chip-more" :aria-label="`Plus ${additionalCardLabelCount} more label${additionalCardLabelCount === 1 ? '' : 's'}`">+{{ additionalCardLabelCount }} more</span>
          </span>
          <span v-if="v2WorkSignalVisible" class="card-v2-signals" :class="`card-v2-signals-${v2Display.density === 'standard' ? 'standard' : 'compact'}`" aria-label="V2 work signals">
            <span class="card-v2-signal card-v2-signal-kind">{{ displayV2Value(v2Kind) }}</span>
            <span v-if="v2Priority" class="card-v2-signal card-v2-signal-priority">{{ v2Priority }}</span>
            <span v-if="v2DerivedBadge" class="card-v2-signal card-v2-signal-derived">{{ v2DerivedBadge }}</span>
            <button class="card-v2-work-details-button metadata-action" type="button" title="Edit work details" aria-label="Edit work details" :aria-expanded="v2PopoverOpen" @click="openV2Popover"><FeatherIcon name="sliders" :size="13" /></button>
          </span>
          <button v-if="dates" class="metadata-action card-date-action" type="button" disabled :aria-label="`Dates ${dates}`"><FeatherIcon name="calendar" /><span class="card-date-label">{{ dates }}</span></button>
          <span v-if="card.taskSummary.total" class="task-progress-badge metadata-action task-progress-badge-inline" :class="{ 'task-progress-badge-complete': card.taskSummary.completed >= card.taskSummary.total }" :aria-label="`${card.taskSummary.completed}/${card.taskSummary.total} tasks completed`"><FeatherIcon name="check-square" /><span class="task-progress-badge-text">{{ card.taskSummary.completed }}/{{ card.taskSummary.total }}</span></span>
          <span v-if="linkedCount" class="linked-objects-badge metadata-action linked-objects-badge-inline" :aria-label="`${linkedCount} linked object${linkedCount === 1 ? '' : 's'}`"><span class="linked-objects-badge-icon"><FeatherIcon name="paperclip" /></span><span class="linked-objects-badge-text">{{ linkedCount }}</span></span>
        </div>
      </div>
    </div>
    <AppPopover v-if="v2WorkSignalVisible" id="cardV2WorkDetailsPopover" :is-open="v2PopoverOpen" :opener="v2PopoverOpener" :on-close="closeV2Popover" aria-label="Work details" class-name="card-v2-work-details-popover">
      <div class="card-v2-work-details-header"><strong>Work details</strong><button type="button" class="card-v2-work-details-close" aria-label="Close work details" @click="closeV2Popover"><FeatherIcon name="x" :size="14" /></button></div>
      <label class="card-v2-work-details-field">Kind<select :value="v2Kind" :disabled="v2Saving" @change="saveV2Field('kind', selectValue($event))"><option v-for="option in V2_KIND_OPTIONS" :key="option" :value="option">{{ displayV2Value(option) }}</option></select></label>
      <label class="card-v2-work-details-field">Work type<select :value="v2WorkType" :disabled="v2Saving" @change="saveV2Field('work_type', selectValue($event))"><option v-for="option in V2_WORK_TYPE_OPTIONS" :key="option" :value="option">{{ displayV2Value(option) }}</option></select></label>
      <label class="card-v2-work-details-field">Priority<select :value="v2Priority" :disabled="v2Saving" @change="saveV2Field('priority_class', selectValue($event))"><option v-for="option in V2_PRIORITY_OPTIONS" :key="option" :value="option">{{ option || 'Unset' }}</option></select></label>
      <label class="card-v2-work-details-field">Effort<select :value="v2Effort" :disabled="v2Saving" @change="saveV2Field('effort_points', selectValue($event))"><option v-for="option in V2_EFFORT_OPTIONS" :key="option" :value="option">{{ option || 'Unset' }}</option></select></label>
      <p v-if="v2SaveError" class="card-v2-work-details-error" role="alert">{{ v2SaveError }}</p>
      <button class="card-v2-work-details-editor-link" type="button" @click="openMoreV2Details">More in editor</button>
    </AppPopover>
    <Teleport to="body">
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
.card-v2-signals-standard .card-v2-signal { min-height: 21px; font-size: 11px; }
.card-v2-signal { display: inline-flex; align-items: center; min-height: 19px; padding: 1px 6px; border: 1px solid var(--border, #e6e8ec); border-radius: 999px; color: var(--muted, #6b7280); font-size: 10px; line-height: 1.2; white-space: nowrap; }
.card-v2-signal-kind { color: var(--text, #111827); }
.card-v2-signal-priority { border-color: color-mix(in srgb, var(--primary, #0b5fff) 45%, var(--border, #e6e8ec)); color: var(--primary, #0b5fff); font-weight: 700; }
.card-v2-signal-derived { border-color: color-mix(in srgb, #f59e0b 45%, var(--border, #e6e8ec)); color: #a16207; }
.card-v2-work-details-button { display: inline-flex; width: 22px; height: 22px; align-items: center; justify-content: center; padding: 0; border: 0; background: transparent; color: var(--muted, #6b7280); cursor: pointer; }
.card-v2-work-details-button:hover, .card-v2-work-details-button:focus-visible { color: var(--primary, #0b5fff); }
.card-v2-work-details-popover { width: 230px; padding: 12px; }
.card-v2-work-details-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.card-v2-work-details-close { display: inline-flex; align-items: center; justify-content: center; padding: 3px; border: 0; background: transparent; color: var(--muted, #6b7280); cursor: pointer; }
.card-v2-work-details-field { display: grid; gap: 4px; margin-top: 8px; color: var(--muted, #6b7280); font-size: 11px; }
.card-v2-work-details-field select { width: 100%; min-height: 29px; padding: 3px 6px; border: 1px solid var(--border, #e6e8ec); border-radius: 5px; background: var(--surface, #fff); color: var(--text, #111827); }
.card-v2-work-details-error { margin: 8px 0 0; color: #b91c1c; font-size: 11px; }
.card-v2-work-details-editor-link { margin-top: 12px; padding: 0; border: 0; background: transparent; color: var(--primary, #0b5fff); cursor: pointer; font-size: 12px; }
</style>
