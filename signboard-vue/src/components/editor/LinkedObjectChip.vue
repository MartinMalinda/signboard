<script setup lang="ts">
import { ref } from 'vue'
import FeatherIcon from '../FeatherIcon.vue'
import type { LinkedObject } from '../../types'

const props = defineProps<{ object: LinkedObject; onOpen: (object: LinkedObject) => void; onRemove: (object: LinkedObject) => void; onRecreate?: (object: LinkedObject) => void; onRelink?: (object: LinkedObject) => void; status?: { missing?: boolean } }>()
const busy = ref(false)
function label(object: LinkedObject) { return object.title || object.path?.split(/[\\/]/).filter(Boolean).pop() || object.url || (object.type === 'signboard-link' ? 'Signboard link' : 'Linked object') }
function icon(object: LinkedObject) { return object.type === 'folder' ? 'folder' : object.type === 'url' ? 'link' : object.type === 'obsidian-note' ? 'file-text' : object.type === 'signboard-link' ? 'columns' : object.type === 'app-link' ? 'external-link' : 'paperclip' }
async function open() { busy.value = true; try { await props.onOpen(props.object) } finally { busy.value = false } }
</script>
<template>
  <span class="card-editor-related-note" :class="{ 'is-missing': props.status?.missing }">
    <button class="card-editor-related-note-open" type="button" :aria-label="`Open ${label(props.object)}`" :title="props.status?.missing ? 'Linked note not found' : 'Open linked object'" :disabled="busy" @click="void open()">
      <img v-if="props.object.type === 'url' && props.object.faviconPath" :src="`file://${encodeURI(props.object.faviconPath)}`" alt="" class="card-editor-related-note-icon-image">
      <FeatherIcon v-else :name="icon(props.object)" />
      <span class="card-editor-related-note-label">{{ props.status?.missing ? `Missing: ${label(props.object)}` : label(props.object) }}</span>
    </button>
    <template v-if="props.status?.missing && props.object.type === 'obsidian-note'">
      <button v-if="props.onRecreate" class="card-editor-related-note-action card-editor-related-note-recreate" type="button" title="Recreate linked note" aria-label="Recreate linked note" @click="props.onRecreate(props.object)"><FeatherIcon name="file-plus" /></button>
      <button v-if="props.onRelink" class="card-editor-related-note-action card-editor-related-note-relink" type="button" title="Relink note" aria-label="Relink note" @click="props.onRelink(props.object)"><FeatherIcon name="link" /></button>
    </template>
    <button class="card-editor-related-note-remove" type="button" title="Remove linked object" :aria-label="`Remove ${label(props.object)}`" @click="props.onRemove(props.object)"><FeatherIcon name="x" /></button>
  </span>
</template>
