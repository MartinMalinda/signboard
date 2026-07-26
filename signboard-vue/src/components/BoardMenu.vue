<script setup lang="ts">
import { ref } from 'vue'
import { useUiStore } from '../stores/useUiStore'
import { useBoardsStore } from '../stores/useBoardsStore'
import FeatherIcon from './FeatherIcon.vue'
import AppPopover from '../lib/components/AppPopover.vue'
import { getShortcutAriaKeyshortcuts, getShortcutHintText } from '../../lib/shortcutLabels.js'

const ui = useUiStore()
const boards = useBoardsStore()
const props = defineProps<{ onOpenSettings?: () => void; onOpenArchive?: () => void; onOpenSponsor?: () => void }>()
const opener = ref<HTMLElement | null>(null)
</script>

<template>
  <div class="board-toolbar-group" id="boardMenuGroup">
    <button id="boardMenuButton" ref="opener" type="button" title="Board menu" aria-label="Board menu" :aria-expanded="ui.boardMenuOpen" aria-haspopup="menu" aria-controls="boardMenuPopover" @click="ui.toggleBoardMenu()">
      <FeatherIcon name="menu" />
    </button>
    <AppPopover id="boardMenuPopover" :is-open="ui.boardMenuOpen" :opener="opener" :on-close="ui.closeBoardMenu" aria-label="Board menu" class-name="board-menu-popover">
      <button id="openBoardSettings" class="board-menu-action" type="button" :disabled="!boards.activeBoardPath" :aria-keyshortcuts="getShortcutAriaKeyshortcuts('boardSettings')" @click="props.onOpenSettings?.(); ui.closeBoardMenu()"><FeatherIcon name="sliders" /><span>Settings</span><span class="menu-shortcut-hint">{{ getShortcutHintText('boardSettings') }}</span></button>
      <button id="openArchiveBrowser" class="board-menu-action" type="button" :disabled="!boards.activeBoardPath" :aria-keyshortcuts="getShortcutAriaKeyshortcuts('archiveBrowser')" @click="props.onOpenArchive?.(); ui.closeBoardMenu()"><FeatherIcon name="archive" /><span>Archive</span></button>
      <button id="themeToggle" class="board-menu-action" type="button" :aria-label="ui.isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'" :aria-keyshortcuts="getShortcutAriaKeyshortcuts('toggleTheme')" @click="ui.toggleTheme(); ui.closeBoardMenu()">
        <FeatherIcon :name="ui.isDarkMode ? 'sun' : 'moon'" /><span>{{ ui.isDarkMode ? 'Light Mode' : 'Dark Mode' }}</span>
      </button>
      <button id="openCommercialLicenseModal" class="board-menu-action" type="button" @click="props.onOpenSponsor?.(); ui.closeBoardMenu()"><FeatherIcon name="heart" /><span>Sponsor</span></button>
    </AppPopover>
  </div>
</template>
