<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { parseTaskListItems, setTaskListItemDateByLineIndex } from '../../../lib/taskList.js'
import FeatherIcon from '../FeatherIcon.vue'

const props = defineProps<{ onBodyChange: (body: string) => void }>()
const layer = ref<HTMLElement | null>(null)
let textarea: HTMLTextAreaElement | null = null
let wrapper: HTMLElement | null = null
let preview: HTMLElement | null = null
let cleanup: (() => void) | null = null
let raf = 0

function measuredPositions(items: Array<{ lineIndex: number; lineStart: number; line: string }>) {
  const positions = new Map<number, { top: number; left: number; height: number }>()
  const layerRect = layer.value?.getBoundingClientRect()
  if (!layerRect || !textarea) return positions

  // Prefer rendered preview ranges: wrapped lines and proportional fonts cannot
  // be positioned correctly by line-height multiplication.
  const children = preview ? [...preview.children] as HTMLElement[] : []
  items.forEach((item) => {
    const child = children[item.lineIndex]
    const rect = child?.getBoundingClientRect()
    if (rect?.height) positions.set(item.lineIndex, { top: rect.top - layerRect.top, left: rect.left - layerRect.left, height: rect.height })
  })
  if (positions.size === items.length) return positions

  const mirror = document.createElement('div')
  const text = textarea.value
  const rect = textarea.getBoundingClientRect()
  Object.assign(mirror.style, {
    position: 'absolute', top: `${rect.top - layerRect.top}px`, left: `${rect.left - layerRect.left}px`,
    width: `${rect.width}px`, whiteSpace: 'pre-wrap', overflowWrap: 'break-word', visibility: 'hidden',
    font: getComputedStyle(textarea).font, lineHeight: getComputedStyle(textarea).lineHeight,
    padding: getComputedStyle(textarea).padding, boxSizing: 'border-box',
  })
  layer.value?.appendChild(mirror)
  let cursor = 0
  for (const item of [...items].sort((a, b) => a.lineStart - b.lineStart)) {
    const anchor = Math.min(Math.max(0, item.lineStart), Math.max(0, text.length - 1))
    if (anchor > cursor) mirror.append(document.createTextNode(text.slice(cursor, anchor)))
    const marker = document.createElement('span')
    marker.textContent = '\u200b'
    mirror.append(marker)
    const markerRect = marker.getBoundingClientRect()
    positions.set(item.lineIndex, { top: markerRect.top - layerRect.top, left: markerRect.left - layerRect.left, height: markerRect.height })
    cursor = anchor
  }
  mirror.remove()
  return positions
}

function render() {
  if (!textarea || !layer.value) return
  layer.value.replaceChildren()
  const items = parseTaskListItems(textarea.value)
  const style = getComputedStyle(textarea)
  const lineHeight = Math.max(Number.parseFloat(style.lineHeight) || 25.6, 18)
  const positions = measuredPositions(items)
  for (const item of items) {
    const position = positions.get(item.lineIndex)
    if (!position) continue
    const top = Math.round(position.top - textarea.scrollTop + (Math.max(position.height, lineHeight) - 18) / 2 - 3)
    const left = Math.max(1, Math.round(position.left - textarea.scrollLeft - 38))
    const button = document.createElement('button')
    button.type = 'button'; button.className = 'task-line-date-control'
    button.style.top = `${top}px`; button.style.left = `${left}px`
    button.dataset.lineIndex = String(item.lineIndex)
    button.classList.toggle('has-start', Boolean(item.start)); button.classList.toggle('has-due', Boolean(item.due))
    button.title = item.start && item.due ? `Dates: starts ${item.start}, due ${item.due}` : item.start ? `Starts ${item.start}` : item.due ? `Due ${item.due}` : 'Set task dates'
    button.setAttribute('aria-label', `${button.title}. Change task dates.`)
    button.append(document.createTextNode(item.start || item.due ? '•' : '◷'))
    button.addEventListener('click', () => {
      const current = parseTaskListItems(textarea?.value || '').find((entry) => entry.lineIndex === item.lineIndex)
      if (!textarea || !layer.value) return
      layer.value.querySelector('.task-line-date-popover')?.remove()
      const popover = document.createElement('div')
      popover.className = 'task-line-date-popover label-popover'
      popover.style.top = `${top + 22}px`
      popover.style.left = `${left}px`
      popover.innerHTML = `<label>Start <input data-kind="start" type="date" value="${current?.start || ''}"></label><label>Due <input data-kind="due" type="date" value="${current?.due || ''}"></label>`
      for (const input of [...popover.querySelectorAll('input')]) {
        input.addEventListener('change', () => {
          if (!textarea) return
          props.onBodyChange(setTaskListItemDateByLineIndex(textarea.value, item.lineIndex, input.dataset.kind as 'start' | 'due', input.value))
        })
      }
      layer.value.append(popover)
    })
    layer.value.append(button)
  }
}

function requestRender() { if (!raf) raf = window.requestAnimationFrame(() => { raf = 0; render() }) }

function attach(editor: { textarea?: HTMLTextAreaElement; container?: HTMLElement } | null) {
  cleanup?.()
  textarea = editor?.textarea || null
  wrapper = editor?.container?.querySelector('.overtype-wrapper') || null
  preview = editor?.container?.querySelector('.overtype-preview') || null
  if (!textarea || !wrapper || !layer.value) return
  wrapper.append(layer.value)
  textarea.addEventListener('input', requestRender); textarea.addEventListener('scroll', requestRender); window.addEventListener('resize', requestRender)
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(requestRender) : null
  observer?.observe(textarea); observer?.observe(wrapper)
  cleanup = () => { textarea?.removeEventListener('input', requestRender); textarea?.removeEventListener('scroll', requestRender); window.removeEventListener('resize', requestRender); observer?.disconnect(); layer.value?.replaceChildren() }
  requestRender()
}

defineExpose({ attach, render })
onBeforeUnmount(() => { cleanup?.(); if (raf) window.cancelAnimationFrame(raf) })
</script>
<template><div ref="layer" class="task-line-due-layer"><FeatherIcon name="calendar" /></div></template>
