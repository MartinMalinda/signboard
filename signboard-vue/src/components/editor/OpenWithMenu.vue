<script setup lang="ts">
import { ref } from 'vue'
import FeatherIcon from '../FeatherIcon.vue'

const props = defineProps<{ onAction: (action: 'default' | 'reveal' | 'obsidian' | 'copy-signboard' | 'copy-obsidian') => void; inObsidianVault?: boolean }>()
const open = ref(false)
</script>
<template>
  <div class="card-editor-open-with-wrap">
    <button id="cardEditorOpenWithLink" type="button" title="Open with" aria-label="Open with" :aria-expanded="open" @click="open = !open"><FeatherIcon name="external-link" /></button>
    <div v-if="open" id="cardEditorOpenWithPopover" class="label-popover card-editor-open-with-popover" data-sb-modal-layer>
      <button v-if="inObsidianVault" type="button" @click="props.onAction('obsidian'); open = false">Open in Obsidian</button>
      <button type="button" @click="props.onAction('default'); open = false">Open in Default App</button>
      <button type="button" @click="props.onAction('reveal'); open = false">Reveal File</button>
      <hr />
      <button v-if="inObsidianVault" type="button" @click="props.onAction('copy-obsidian'); open = false">Copy Obsidian URI</button>
      <button type="button" @click="props.onAction('copy-signboard'); open = false">Copy Signboard Link</button>
    </div>
  </div>
</template>

