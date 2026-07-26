<script setup lang="ts">
const props = defineProps<{ boardPath: string; active: boolean; onSelect: (path: string) => void; onClose: (path: string) => void; onFocusMove: (path: string, direction: number) => void; onFocusEdge: (edge: 'start' | 'end') => void }>()
const label = props.boardPath.replace(/\/+$/, '').split('/').filter(Boolean).pop() || 'Board'

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault()
    props.onFocusMove(props.boardPath, event.key === 'ArrowRight' ? 1 : -1)
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault()
    props.onFocusEdge(event.key === 'Home' ? 'start' : 'end')
  } else if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    props.onClose(props.boardPath)
  }
}
</script>

<template>
  <div class="board-tab" :class="{ 'is-active': active }" :data-board-path="boardPath" role="presentation" :title="boardPath">
    <button class="board-tab-label" type="button" role="tab" aria-controls="board" :aria-selected="active" :aria-label="`Open ${label} board`" @click="onSelect(boardPath)" @keydown="handleKeydown">{{ label }}</button>
    <button class="board-tab-close" type="button" :aria-label="`Close ${label} board`" :title="`Close ${label}`" @click="onClose(boardPath)">×</button>
  </div>
</template>
