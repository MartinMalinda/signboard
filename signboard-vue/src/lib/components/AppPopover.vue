<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, onUpdated, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  isOpen: boolean
  id?: string
  opener?: HTMLElement | null
  onClose: () => void
  ariaLabel?: string
  className?: string
  role?: string
}>(), { id: '', opener: null, ariaLabel: '', className: '' })

const root = ref<HTMLElement | null>(null)
const isPositioned = ref(false)
let wasOpen = false
let restoreTarget: HTMLElement | null = null
let positionListenersAttached = false
let positionRetryTimer: number | null = null

function clearPositionRetry() {
  if (positionRetryTimer !== null) {
    window.clearTimeout(positionRetryTimer)
    positionRetryTimer = null
  }
}

function position() {
  if (!root.value || !props.opener || !props.opener.isConnected) {
    isPositioned.value = false
    return false
  }
  const rect = props.opener.getBoundingClientRect()
  const hasUsableRect = [rect.left, rect.right, rect.top, rect.bottom, rect.width, rect.height].every(Number.isFinite)
    && (rect.width > 0 || rect.height > 0 || rect.right !== 0 || rect.bottom !== 0)
  if (!hasUsableRect) {
    isPositioned.value = false
    return false
  }
  const width = root.value.offsetWidth || 240
  const height = root.value.offsetHeight || 180
  root.value.style.left = `${Math.max(8, Math.min(window.innerWidth - width - 8, rect.right - width))}px`
  root.value.style.top = `${Math.max(8, Math.min(window.innerHeight - height - 8, rect.bottom + 6))}px`
  isPositioned.value = true
  return true
}

function retryPosition(attempt = 0) {
  if (!props.isOpen) return
  if (position()) return
  if (attempt >= 4) {
    if (!props.opener?.isConnected) props.onClose()
    return
  }
  positionRetryTimer = window.setTimeout(() => {
    positionRetryTimer = null
    retryPosition(attempt + 1)
  }, 16)
}

function schedulePosition() {
  clearPositionRetry()
  void nextTick(() => retryPosition())
}

function onPositionChange() {
  if (props.isOpen) position()
}

watch(() => props.opener, () => {
  if (!props.isOpen) return
  isPositioned.value = false
  schedulePosition()
})

function addPositionListeners() {
  if (positionListenersAttached) return
  document.addEventListener('scroll', onPositionChange, true)
  window.addEventListener('resize', onPositionChange)
  positionListenersAttached = true
}

function removePositionListeners() {
  if (!positionListenersAttached) return
  document.removeEventListener('scroll', onPositionChange, true)
  window.removeEventListener('resize', onPositionChange)
  positionListenersAttached = false
}

function options() { return Array.from(root.value?.querySelectorAll<HTMLElement>('button:not(:disabled):not([tabindex="-1"]), input:not(:disabled):not([tabindex="-1"]), select:not(:disabled):not([tabindex="-1"]), [role="menuitem"], [role="menuitemcheckbox"]') || []) }

function closeAndRestoreFocus() {
  props.onClose()
  void nextTick(() => (props.opener || restoreTarget)?.focus())
}

function onKeydown(event: KeyboardEvent) {
  if (!props.isOpen || !root.value) return
  if (event.key === 'Escape') { event.preventDefault(); closeAndRestoreFocus(); return }
  const items = options(); const index = items.indexOf(document.activeElement as HTMLElement)
  if (event.key === 'Home' || event.key === 'ArrowUp' && index <= 0) { event.preventDefault(); items[0]?.focus() }
  else if (event.key === 'End' || event.key === 'ArrowDown' && index >= items.length - 1) { event.preventDefault(); items[items.length - 1]?.focus() }
  else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') { event.preventDefault(); items[(index + 1 + items.length) % items.length]?.focus() }
  else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') { event.preventDefault(); items[(index - 1 + items.length) % items.length]?.focus() }
}

function onPointerdown(event: PointerEvent) {
  if (props.isOpen && root.value && !root.value.contains(event.target as Node) && !props.opener?.contains(event.target as Node)) closeAndRestoreFocus()
}

onMounted(() => { document.addEventListener('keydown', onKeydown); document.addEventListener('pointerdown', onPointerdown); if (props.isOpen) { wasOpen = true; addPositionListeners(); restoreTarget = props.opener || (document.activeElement instanceof HTMLElement ? document.activeElement : null); schedulePosition(); options()[0]?.focus() } })
onUpdated(() => {
  if (props.isOpen && !wasOpen) { wasOpen = true; isPositioned.value = false; addPositionListeners(); restoreTarget = props.opener || (document.activeElement instanceof HTMLElement ? document.activeElement : null); schedulePosition(); options()[0]?.focus() }
  else if (!props.isOpen && wasOpen) { wasOpen = false; isPositioned.value = false; clearPositionRetry(); removePositionListeners(); void nextTick(() => (props.opener || restoreTarget)?.focus()); restoreTarget = null }
})
onBeforeUnmount(() => { document.removeEventListener('keydown', onKeydown); document.removeEventListener('pointerdown', onPointerdown); clearPositionRetry(); removePositionListeners() })
</script>

<template>
  <Teleport to="body">
    <div ref="root" :id="props.id || undefined" :hidden="!isOpen" :class="['label-popover', 'app-popover', props.className, { hidden: !isOpen }]" data-sb-modal-layer :role="props.role || 'menu'" :aria-hidden="!isOpen" :aria-label="ariaLabel || undefined" :style="{ position: 'fixed', visibility: isOpen && !isPositioned ? 'hidden' : 'visible' }" @click.stop>
      <slot />
    </div>
  </Teleport>
</template>
