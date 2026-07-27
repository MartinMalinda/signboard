<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { getFrontmatterLinkedObjectCount } from '../../../lib/linkedObjects.js'
import type { CardSnapshot } from '../../types'
import FeatherIcon from '../FeatherIcon.vue'

const props = withDefaults(defineProps<{ card: CardSnapshot; isVisible?: boolean; onOpen?: (path: string) => void; onArchive?: (path: string) => void; onDuplicate?: (path: string) => void }>(), { isVisible: true })
const frontmatter = computed(() => props.card.frontmatter || {})
const title = computed(() => String(frontmatter.value.title || '').replace('# ', '') || 'Untitled')
const linkedCount = computed(() => getFrontmatterLinkedObjectCount(frontmatter.value))
const preview = computed(() => props.card.body.split(/\r?\n/).find((line) => line.trim()) || '')
const startDate = computed(() => String(frontmatter.value.start || '').trim())
const dueDate = computed(() => String(frontmatter.value.due || '').trim())
const CARD_CLICK_DRAG_TOLERANCE_PX = 6

let pointerState: { pointerId: number | null; clientX: number; clientY: number; moved: boolean } | null = null
let suppressNextClick = false
let suppressClickTimer: number | null = null
const contextMenu = ref<HTMLElement | null>(null)
const contextMenuPosition = ref({ left: 0, top: 0 })
const contextMenuOpen = ref(false)
let contextMenuRestoreTarget: HTMLElement | null = null

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
  return Boolean(target.closest('button:not(.card-title-button), a, input, select, textarea, [contenteditable="true"], [contenteditable="plaintext-only"], .card-label-chip'))
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
  return Boolean(target.closest('.card-labels, .card-label-chip, .card-archive-button, .metadata-action, input, select, textarea, [contenteditable="true"], [contenteditable="plaintext-only"]'))
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
  const items = Array.from(contextMenu.value.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'))
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
      <div class="card-body"><p>{{ preview.length > 50 ? `${preview.slice(0, 35)}...` : preview }}</p>
        <div class="metadata">
          <button v-if="dates" class="metadata-action card-date-action" type="button" disabled :aria-label="`Dates ${dates}`"><FeatherIcon name="calendar" /><span class="card-date-label">{{ dates }}</span></button>
          <span v-if="card.taskSummary.total" class="task-progress-badge metadata-action task-progress-badge-inline" :class="{ 'task-progress-badge-complete': card.taskSummary.completed >= card.taskSummary.total }" :aria-label="`${card.taskSummary.completed}/${card.taskSummary.total} tasks completed`"><FeatherIcon name="check-square" /><span class="task-progress-badge-text">{{ card.taskSummary.completed }}/{{ card.taskSummary.total }}</span></span>
          <span v-if="linkedCount" class="linked-objects-badge metadata-action linked-objects-badge-inline" :aria-label="`${linkedCount} linked object${linkedCount === 1 ? '' : 's'}`"><span class="linked-objects-badge-icon"><FeatherIcon name="paperclip" /></span><span class="linked-objects-badge-text">{{ linkedCount }}</span></span>
        </div>
      </div>
    </div>
    <Teleport to="body">
      <div v-if="contextMenuOpen" ref="contextMenu" class="card-context-menu label-popover" role="menu" aria-label="Card actions" :style="{ left: `${contextMenuPosition.left}px`, top: `${contextMenuPosition.top}px` }" @contextmenu.prevent.stop>
        <button class="list-actions-option" type="button" role="menuitem" @click="duplicateFromContextMenu"><FeatherIcon name="copy" /><span class="list-actions-option-label">Duplicate card</span></button>
        <button class="list-actions-option list-actions-option-destructive" type="button" role="menuitem" @click="archiveFromContextMenu"><FeatherIcon name="archive" /><span class="list-actions-option-label">Archive card</span></button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.card-drag-frame { position: relative; }
</style>
