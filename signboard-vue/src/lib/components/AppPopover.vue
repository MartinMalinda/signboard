<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, onUpdated, ref } from 'vue'

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
let wasOpen = false
let restoreTarget: HTMLElement | null = null
let positionListenersAttached = false

function position() {
  if (!root.value || !props.opener) return
  const rect = props.opener.getBoundingClientRect()
  const width = root.value.offsetWidth || 240
  const height = root.value.offsetHeight || 180
  root.value.style.left = `${Math.max(8, Math.min(window.innerWidth - width - 8, rect.right - width))}px`
  root.value.style.top = `${Math.max(8, Math.min(window.innerHeight - height - 8, rect.bottom + 6))}px`
}

function onPositionChange() {
  if (props.isOpen) position()
}

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
function focusFirst() { void nextTick(() => { position(); options()[0]?.focus() }) }

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

onMounted(() => { document.addEventListener('keydown', onKeydown); document.addEventListener('pointerdown', onPointerdown); if (props.isOpen) { wasOpen = true; addPositionListeners(); restoreTarget = props.opener || (document.activeElement instanceof HTMLElement ? document.activeElement : null); focusFirst() } })
onUpdated(() => {
  if (props.isOpen && !wasOpen) { wasOpen = true; addPositionListeners(); restoreTarget = props.opener || (document.activeElement instanceof HTMLElement ? document.activeElement : null); focusFirst() }
  else if (!props.isOpen && wasOpen) { wasOpen = false; removePositionListeners(); void nextTick(() => (props.opener || restoreTarget)?.focus()); restoreTarget = null }
})
onBeforeUnmount(() => { document.removeEventListener('keydown', onKeydown); document.removeEventListener('pointerdown', onPointerdown); removePositionListeners() })
</script>

<template>
  <Teleport to="body">
    <div ref="root" :id="props.id || undefined" :hidden="!isOpen" :class="['label-popover', 'app-popover', props.className, { hidden: !isOpen }]" data-sb-modal-layer :role="props.role || 'menu'" :aria-hidden="!isOpen" :aria-label="ariaLabel || undefined" style="position: fixed" @click.stop>
      <slot />
    </div>
  </Teleport>
</template>
