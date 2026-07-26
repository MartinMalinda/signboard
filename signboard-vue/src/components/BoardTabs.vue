<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useBoardsStore } from '../stores/useBoardsStore'
import BoardTab from './BoardTab.vue'

const props = defineProps<{ onOpen: () => void; onOpenSwitcher?: () => void }>()
const boards = useBoardsStore()
const compact = ref(false)

function updateCompact() { compact.value = window.innerWidth <= 980 }
const visiblePaths = computed(() => {
  if (!compact.value || boards.openBoardPaths.length <= 6) return boards.openBoardPaths
  const activeIndex = Math.max(0, boards.openBoardPaths.indexOf(boards.activeBoardPath))
  const priority = [boards.openBoardPaths[activeIndex]]
  for (let offset = 1; priority.length < 6 && offset < boards.openBoardPaths.length; offset += 1) {
    if (boards.openBoardPaths[activeIndex - offset]) priority.push(boards.openBoardPaths[activeIndex - offset])
    if (boards.openBoardPaths[activeIndex + offset] && priority.length < 6) priority.push(boards.openBoardPaths[activeIndex + offset])
  }
  return priority.filter((path): path is string => Boolean(path))
})
const hiddenCount = computed(() => Math.max(0, boards.openBoardPaths.length - visiblePaths.value.length))

function tabButtons() {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('#boardTabs .board-tab-label[data-board-path], #boardTabs .board-tab-label'))
}
function focusIndex(index: number) {
  const buttons = tabButtons()
  if (!buttons.length) return
  buttons[(index + buttons.length) % buttons.length]?.focus()
}
function focusMove(path: string, direction: number) {
  const index = boards.openBoardPaths.indexOf(path)
  focusIndex(index + direction)
}
function focusEdge(edge: 'start' | 'end') { focusIndex(edge === 'start' ? 0 : -1) }
async function select(path: string) { await boards.activateBoard(path) }
async function close(path: string) { await boards.closeBoard(path); await nextTick() }
onMounted(() => { updateCompact(); window.addEventListener('resize', updateCompact) })
onBeforeUnmount(() => window.removeEventListener('resize', updateCompact))
</script>

<template>
  <div id="boardTabs" role="tablist" aria-label="Open Boards">
    <BoardTab v-for="path in visiblePaths" :key="path" :board-path="path" :active="path === boards.activeBoardPath" :on-select="select" :on-close="close" :on-focus-move="focusMove" :on-focus-edge="focusEdge" />
    <div v-if="hiddenCount" class="board-tab board-tab-more" role="presentation"><button class="board-tab-label board-tab-more-label" type="button" :aria-label="`Show ${hiddenCount} more open ${hiddenCount === 1 ? 'board' : 'boards'}`" :title="`Show ${hiddenCount} more open boards`" aria-haspopup="dialog" @click="props.onOpenSwitcher?.()">{{ hiddenCount }} more</button></div>
    <div class="board-tab board-tab-add" role="presentation"><button class="board-tab-label board-tab-add-label" type="button" aria-label="Add board" title="Add board" @click="props.onOpen">+ Add Board</button></div>
  </div>
</template>
