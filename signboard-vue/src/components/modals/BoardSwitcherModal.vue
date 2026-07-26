<script setup lang="ts">
import { nextTick, onUpdated, ref } from 'vue'
import Modal from '../../lib/components/Modal.vue'
import FeatherIcon from '../FeatherIcon.vue'
import { useBoardSwitcherStore } from '../../stores/useBoardSwitcherStore'

const props = defineProps<{ onSwitch?: (path: string) => Promise<boolean> }>()
const switcher = useBoardSwitcherStore()
const input = ref<HTMLInputElement | null>(null)

function focusInput(select = true) {
  void nextTick(() => {
    input.value?.focus()
    if (select) input.value?.select()
  })
}

function close() { switcher.close() }
function select(path: string) { void switcher.select(path, props.onSwitch) }

function onInput(event: Event) { switcher.setQuery((event.target as HTMLInputElement).value) }
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') { event.preventDefault(); switcher.move(1) }
  else if (event.key === 'ArrowUp') { event.preventDefault(); switcher.move(-1) }
  else if (event.key === 'Home') { event.preventDefault(); switcher.moveTo(0) }
  else if (event.key === 'End') { event.preventDefault(); switcher.moveTo(switcher.filteredOptions.length - 1) }
  else if (event.key === 'Enter') { event.preventDefault(); const option = switcher.selectedOption(); if (option) select(option.path) }
  else if (event.key === 'Escape') { event.preventDefault(); close() }
}

onUpdated(() => { if (switcher.isOpen && document.activeElement !== input.value) focusInput(false) })
</script>

<template>
  <Modal id="modalBoardSwitcher" modal-class="board-switcher-modal" positioning="fixed" :show-chrome="false" aria-label="Switch to board" :aria-modal="false" :overlay="false" :is-open="switcher.isOpen" :on-close="close" initial-focus="#boardSwitcherInput">
    <input ref="input" id="boardSwitcherInput" type="search" role="combobox" placeholder="Switch to board" autocomplete="off" spellcheck="false" aria-autocomplete="list" aria-controls="boardSwitcherResults" :aria-expanded="switcher.isOpen" :aria-activedescendant="switcher.selectedOption() ? `boardSwitcherOption-${switcher.filteredOptions.indexOf(switcher.selectedOption()!)}` : undefined" :value="switcher.query" @input="onInput" @keydown="onKeydown">
    <div id="boardSwitcherResults" class="board-switcher-results" role="listbox" aria-label="Open boards">
      <div v-if="!switcher.options.length" class="board-switcher-empty">No open boards</div>
      <div v-else-if="!switcher.filteredOptions.length" class="board-switcher-empty">No matching boards</div>
      <div v-for="(option, index) in switcher.filteredOptions" v-else :id="`boardSwitcherOption-${index}`" :key="option.path" class="board-switcher-option" :class="{ 'is-active': switcher.activeIndex === index, 'is-current': option.isCurrent }" role="option" :aria-selected="switcher.activeIndex === index" :data-board-path="option.path" @mouseenter="switcher.moveTo(index)">
        <button class="board-switcher-select" type="button" :aria-label="`Switch to ${option.label}`" @mousedown.prevent @click="select(option.path)">
          <span class="board-switcher-option-copy"><span class="board-switcher-option-title">{{ option.label }}</span><span class="board-switcher-option-path">{{ option.path }}</span></span>
          <span v-if="option.isCurrent" class="board-switcher-current">Current</span>
        </button>
        <button class="board-switcher-close" type="button" :aria-label="`Close ${option.label} board`" :title="`Close ${option.label}`" @click.stop="void switcher.closeBoard(option.path)"><FeatherIcon name="x" :size="14" /></button>
      </div>
    </div>
  </Modal>
</template>
