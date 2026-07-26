<script setup lang="ts">
import { computed, ref } from 'vue'
import AppPopover from '../../lib/components/AppPopover.vue'
import FeatherIcon from '../FeatherIcon.vue'
import LinkedObjectChip from './LinkedObjectChip.vue'
import { useEditorStore } from '../../stores/useEditorStore'
import type { LinkedObject } from '../../types'

const editor = useEditorStore()
const open = ref(false)
const trigger = ref<HTMLElement | null>(null)
const url = ref('')
const appUrl = ref('')
const status = ref('')
const missing = ref<Record<string, boolean>>({})
const objects = computed<LinkedObject[]>(() => editor.linkedObjects as unknown as LinkedObject[])
function key(object: LinkedObject) { return `${object.type}:${object.path || object.url || object.target || object.title || ''}` }
function close() { open.value = false; status.value = '' }
async function add(input: LinkedObject) { const result = await editor.addLinkedObject(input); if (result?.ok !== false) status.value = 'Linked object.'; return result }
async function pick(mode: 'file' | 'folder') {
  const selected = await window.chooser.pickLinkedObjects?.({ mode })
  const item = selected?.[0]
  if (item) await add({ type: mode, token: item.token || item.path, title: item.path?.split(/[\\/]/).pop() })
}
async function addUrl(kind: 'url' | 'app-link') {
  const source = kind === 'url' ? url.value : appUrl.value
  const value = kind === 'url' && !/^[a-z][a-z0-9+.-]*:/i.test(source) ? `https://${source}` : source
  if (!value.trim()) return
  const result = await add({ type: kind, url: value.trim() })
  if (result?.ok !== false) { if (kind === 'url') url.value = ''; else appUrl.value = '' }
}
async function createNote() { const result = await editor.createLinkedNote(); if (result?.ok !== false) status.value = 'Created linked Obsidian note.' }
async function openObject(object: LinkedObject) {
  const result = await editor.openLinkedObject(object)
  if (result?.error === 'NOTE_NOT_FOUND') missing.value = { ...missing.value, [key(object)]: true }
}
async function relink(object: LinkedObject) {
  const selected = await window.chooser.pickLinkedObjects?.({ mode: 'file', defaultPath: object.path?.split(/[\\/]/).slice(0, -1).join('/') })
  const item = selected?.[0]
  if (!item) return
  const result = await editor.relinkLinkedNote(object, { type: 'obsidian-note', token: item.token || item.path, title: item.path?.split(/[\\/]/).pop()?.replace(/\.md$/i, '') })
  if (result?.ok) missing.value = { ...missing.value, [key(object)]: false }
}
async function drop(event: DragEvent) {
  const files = event.dataTransfer?.files
  if (!files?.length || !editor.cardPath || !window.chooser.linkDroppedObjects) return
  const result = await window.chooser.linkDroppedObjects(editor.cardPath, files)
  if (result?.frontmatter) editor.frontmatter = result.frontmatter
  if (result?.ok) status.value = 'Linked dropped files.'
}
</script>
<template>
  <div id="cardEditorLinkedObjects" class="card-editor-linked-objects" @dragover.prevent.stop @drop.prevent.stop="void drop($event)">
    <button id="cardEditorLinkedObjectsLink" ref="trigger" type="button" class="card-editor-linked-objects-button" :aria-expanded="open" :aria-label="`Linked objects, ${objects.length} objects`" title="Linked objects" @click="open = !open"><FeatherIcon name="paperclip" /><span id="cardEditorLinkedObjectsCount" v-if="objects.length">{{ objects.length }}</span></button>
    <div id="cardEditorRelatedNotes" class="card-editor-related-notes" :hidden="objects.length === 0">
      <LinkedObjectChip v-for="object in objects" :key="key(object)" :object="object" :status="{ missing: missing[key(object)] }" :on-open="openObject" :on-remove="(value) => { void editor.removeLinkedObject(value) }" :on-recreate="(value) => { void editor.recreateLinkedNote(value) }" :on-relink="relink" />
    </div>
    <AppPopover id="cardEditorLinkedObjectsPopover" :is-open="open" :opener="trigger" :on-close="close" aria-label="Linked objects">
      <div class="card-editor-linked-objects-menu">
        <button type="button" @click="void pick('file')"><FeatherIcon name="file" />Link File</button>
        <button type="button" @click="void pick('folder')"><FeatherIcon name="folder" />Link Folder</button>
        <button type="button" @click="void createNote()"><FeatherIcon name="file-plus" />Create Obsidian Note</button>
        <label for="cardEditorLinkedObjectUrlInput">Link URL</label><input id="cardEditorLinkedObjectUrlInput" :value="url" type="url" placeholder="https://example.com" @input="url = ($event.target as HTMLInputElement).value" @keydown.enter.prevent="void addUrl('url')"><button type="button" @click="void addUrl('url')">Add URL</button>
        <label for="cardEditorLinkedObjectAppUrlInput">Link App or Signboard URL</label><input id="cardEditorLinkedObjectAppUrlInput" :value="appUrl" type="text" placeholder="obsidian:// or signboard://" @input="appUrl = ($event.target as HTMLInputElement).value" @keydown.enter.prevent="void addUrl('app-link')"><button type="button" @click="void addUrl('app-link')">Add App Link</button>
        <p v-if="status" role="status">{{ status }}</p>
      </div>
    </AppPopover>
  </div>
</template>
