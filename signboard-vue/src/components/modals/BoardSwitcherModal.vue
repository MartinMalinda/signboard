<script setup lang="ts">
import { nextTick, onUpdated, ref, watch } from 'vue'
import Modal from '../../lib/components/Modal.vue'
import FeatherIcon from '../FeatherIcon.vue'
import { useBoardSwitcherStore } from '../../stores/useBoardSwitcherStore'

const props = defineProps<{ onSwitch?: (path: string) => Promise<boolean>; onOpenCard?: (path: string) => Promise<void> }>()
const switcher = useBoardSwitcherStore()
const input = ref<HTMLInputElement | null>(null)

function focusInput(select = true) {
  void nextTick(() => {
    input.value?.focus()
    if (select) input.value?.select()
  })
}

function close() { switcher.close() }
function select(option: ReturnType<typeof switcher.selectedOption>) { if (option) void switcher.select(option, props.onSwitch, props.onOpenCard) }

function onInput(event: Event) { switcher.setQuery((event.target as HTMLInputElement).value) }
function scrollActiveOptionIntoView() {
  void nextTick(() => {
    const option = document.getElementById(`boardSwitcherOption-${switcher.activeIndex}`)
    if (option && typeof option.scrollIntoView === 'function') option.scrollIntoView({ block: 'nearest' })
  })
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') { event.preventDefault(); switcher.move(1) }
  else if (event.key === 'ArrowUp') { event.preventDefault(); switcher.move(-1) }
  else if (event.key === 'Home') { event.preventDefault(); switcher.moveTo(0) }
  else if (event.key === 'End') { event.preventDefault(); switcher.moveTo(switcher.filteredOptions.length - 1) }
  else if (event.key === 'Enter') { event.preventDefault(); select(switcher.selectedOption()) }
  else if (event.key === 'Escape') { event.preventDefault(); close() }
}

watch(() => switcher.activeIndex, scrollActiveOptionIntoView)
onUpdated(() => { if (switcher.isOpen && document.activeElement !== input.value) focusInput(false) })
</script>

<template>
  <Modal id="modalBoardSwitcher" modal-class="board-switcher-modal" positioning="fixed" :show-chrome="false" aria-label="Switch boards or open cards" :aria-modal="false" :overlay="false" :is-open="switcher.isOpen" :on-close="close" initial-focus="#boardSwitcherInput">
    <input ref="input" id="boardSwitcherInput" type="search" role="combobox" placeholder="Switch to board or card" autocomplete="off" spellcheck="false" aria-autocomplete="list" aria-controls="boardSwitcherResults" :aria-expanded="switcher.isOpen" :aria-activedescendant="switcher.selectedOption() ? `boardSwitcherOption-${switcher.filteredOptions.indexOf(switcher.selectedOption()!)}` : undefined" :value="switcher.query" @input="onInput" @keydown="onKeydown">
    <div id="boardSwitcherResults" class="board-switcher-results" role="listbox" aria-label="Open boards and cards in the current board">
      <div v-if="!switcher.options.length" class="board-switcher-empty">No open boards</div>
      <div v-else-if="!switcher.filteredOptions.length" class="board-switcher-empty">No matching boards or cards</div>
      <div v-for="(option, index) in switcher.filteredOptions" v-else :id="`boardSwitcherOption-${index}`" :key="option.kind === 'board' ? option.path : `card:${option.cardPath}`" class="board-switcher-option" :class="{ 'is-active': switcher.activeIndex === index, 'is-current': option.kind === 'board' && option.isCurrent, 'is-card': option.kind === 'card' }" role="option" :aria-selected="switcher.activeIndex === index" :data-board-path="option.kind === 'board' ? option.path : undefined" :data-card-path="option.kind === 'card' ? option.cardPath : undefined" @mouseenter="switcher.moveTo(index)">
        <button class="board-switcher-select" type="button" :aria-label="option.kind === 'board' ? `Switch to ${option.label}` : `Open card: ${option.label}`" @mousedown.prevent @click="select(option)">
          <span class="board-switcher-option-copy">
            <span class="board-switcher-option-title">{{ option.label }}</span>
            <span v-if="option.kind === 'board'" class="board-switcher-option-path">{{ option.path }}</span>
            <span v-else class="board-switcher-option-excerpt">
              <template v-for="(part, partIndex) in option.excerptParts" :key="`${part.text}-${partIndex}`">
                <mark v-if="part.isMatch">{{ part.text }}</mark>
                <template v-else>{{ part.text }}</template>
              </template>
            </span>
          </span>
          <span v-if="option.kind === 'card'" class="board-switcher-card-list">Card · {{ option.listLabel }}</span>
        </button>
        <button v-if="option.kind === 'board'" class="board-switcher-close" type="button" :aria-label="`Close ${option.label} board`" :title="`Close ${option.label}`" @click.stop="void switcher.closeBoard(option.path)"><FeatherIcon name="x" :size="14" /></button>
      </div>
    </div>
  </Modal>
</template>
