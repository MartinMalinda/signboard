<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useBoardsStore } from '../stores/useBoardsStore'
import BoardTab from './BoardTab.vue'

const props = defineProps<{ onOpen: () => void; onSwitch: (path: string) => Promise<boolean>; onOpenSwitcher?: () => void }>()
const boards = useBoardsStore()
const tabsWidth = ref(0)
const tabsElement = ref<HTMLElement | null>(null)
let tabsResizeObserver: ResizeObserver | null = null

const TAB_MAX_WIDTH_PX = 180
const TAB_MIN_WIDTH_PX = 128
const TAB_ADD_WIDTH_PX = 100
const TAB_MORE_WIDTH_PX = 72

function updateTabsWidth() { tabsWidth.value = tabsElement.value?.clientWidth || 0 }
const visibleLimit = computed(() => {
  const total = boards.openBoardPaths.length
  if (!total || !tabsWidth.value) return total

  const allTabsWidth = total * TAB_MAX_WIDTH_PX + TAB_ADD_WIDTH_PX
  if (allTabsWidth <= tabsWidth.value) return total

  const availableForBoards = tabsWidth.value - TAB_ADD_WIDTH_PX - TAB_MORE_WIDTH_PX
  return Math.max(1, Math.min(total, Math.floor(availableForBoards / TAB_MIN_WIDTH_PX)))
})
const visiblePaths = computed(() => {
  if (visibleLimit.value >= boards.openBoardPaths.length) return boards.openBoardPaths
  const activeIndex = Math.max(0, boards.openBoardPaths.indexOf(boards.activeBoardPath))
  const priority = [boards.openBoardPaths[activeIndex]]
  for (let offset = 1; priority.length < visibleLimit.value && offset < boards.openBoardPaths.length; offset += 1) {
    if (boards.openBoardPaths[activeIndex - offset]) priority.push(boards.openBoardPaths[activeIndex - offset])
    if (boards.openBoardPaths[activeIndex + offset] && priority.length < visibleLimit.value) priority.push(boards.openBoardPaths[activeIndex + offset])
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
async function select(path: string) { console.error('[BoardTabs select]', path); await props.onSwitch(path) }
async function close(path: string) { await boards.closeBoard(path); await nextTick() }
onMounted(() => {
  updateTabsWidth()
  window.addEventListener('resize', updateTabsWidth)
  if (typeof ResizeObserver === 'function' && tabsElement.value) {
    tabsResizeObserver = new ResizeObserver(updateTabsWidth)
    tabsResizeObserver.observe(tabsElement.value)
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateTabsWidth)
  tabsResizeObserver?.disconnect()
  tabsResizeObserver = null
})
</script>

<template>
  <div id="boardTabs" ref="tabsElement" role="tablist" aria-label="Open Boards">
    <BoardTab v-for="path in visiblePaths" :key="path" :board-path="path" :active="path === boards.activeBoardPath" :on-select="select" :on-close="close" :on-focus-move="focusMove" :on-focus-edge="focusEdge" />
    <div v-if="hiddenCount" class="board-tab board-tab-more" role="presentation"><button class="board-tab-label board-tab-more-label" type="button" :aria-label="`Show ${hiddenCount} more open ${hiddenCount === 1 ? 'board' : 'boards'}`" :title="`Show ${hiddenCount} more open boards`" aria-haspopup="dialog" @click="props.onOpenSwitcher?.()">{{ hiddenCount }} more</button></div>
    <div class="board-tab board-tab-add" role="presentation"><button class="board-tab-label board-tab-add-label" type="button" aria-label="Add board" title="Add board" @click="props.onOpen">+ Add Board</button></div>
  </div>
</template>
