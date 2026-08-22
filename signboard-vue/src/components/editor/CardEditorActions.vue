<script setup lang="ts">
import { ref } from 'vue'
import AppPopover from '../../lib/components/AppPopover.vue'
import FeatherIcon from '../FeatherIcon.vue'
const props = defineProps<{ onArchive: () => void | Promise<void>; onCopy: () => void | Promise<void> }>()
const open = ref(false)
const trigger = ref<HTMLElement | null>(null)

function close() {
  open.value = false
}

async function run(action: 'archive' | 'copy') {
  close()
  if (action === 'archive') await props.onArchive()
  else await props.onCopy()
}
</script>
<template>
  <div class="card-editor-actions-menu-wrap">
    <button id="cardEditorActionsMenuButton" ref="trigger" type="button" title="More actions" aria-label="More card actions" aria-haspopup="menu" :aria-expanded="open" @click="open = !open"><FeatherIcon name="more-horizontal" /></button>
    <AppPopover id="cardEditorActionsPopover" class-name="card-editor-actions-popover" :is-open="open" :opener="trigger" :on-close="close" aria-label="Card actions">
      <div class="card-editor-actions-menu">
        <button id="cardEditorCopyMarkdown" type="button" role="menuitem" @click="void run('copy')"><FeatherIcon name="copy" /><span>Copy</span></button>
        <button id="cardEditorArchiveLink" type="button" role="menuitem" aria-keyshortcuts="Alt+Shift+Meta+Backspace" @click="void run('archive')"><FeatherIcon name="archive" /><span>Archive</span></button>
      </div>
    </AppPopover>
  </div>
</template>
