<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useEditorStore } from '../../stores/useEditorStore'
import { useUiStore } from '../../stores/useUiStore'
import RichTextEditor from '../../lib/components/RichTextEditor.vue'
import { findRawUrls } from '../../../lib/rawUrls.js'

const editorStore = useEditorStore()
const ui = useUiStore()
const host = ref<HTMLElement | null>(null)
const tiptap = ref<InstanceType<typeof RichTextEditor> | null>(null)
const useTiptap = import.meta.env.VITE_CARD_EDITOR_NOTES_EDITOR !== 'overtype'
type OverTypeEditor = { setValue?: (value: string) => void; destroy?: () => void; textarea?: HTMLTextAreaElement; container?: HTMLElement }
let editor: OverTypeEditor | null = null
let themeObserver: MutationObserver | null = null
let urlObserver: MutationObserver | null = null
let preview: HTMLElement | null = null

function decorateUrls() {
  if (!preview || preview.dataset.sbUrlDecorating === 'true') return
  preview.dataset.sbUrlDecorating = 'true'
  try {
    const nodes: Text[] = []
    const walker = document.createTreeWalker(preview, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()
    while (node) { if (node.parentElement && !node.parentElement.closest('a, code, pre, .card-editor-body-url-text, button')) nodes.push(node as Text); node = walker.nextNode() }
    for (const textNode of nodes) {
      const source = textNode.nodeValue || ''
      const matches = findRawUrls(source)
      if (!matches.length) continue
      const fragment = document.createDocumentFragment(); let cursor = 0
      for (const match of matches) {
        if (match.start > cursor) fragment.appendChild(document.createTextNode(source.slice(cursor, match.start)))
        const span = document.createElement('span'); span.className = 'card-editor-body-url-text'; span.dataset.url = match.url; span.textContent = match.text
        const button = document.createElement('button'); button.type = 'button'; button.className = 'card-editor-body-url-open-inline'; button.dataset.url = match.url; button.title = 'Open URL in browser'; button.setAttribute('aria-label', 'Open URL in browser'); button.textContent = '↗'
        fragment.append(span, button); cursor = match.end
      }
      if (cursor < source.length) fragment.appendChild(document.createTextNode(source.slice(cursor)))
      textNode.parentNode?.replaceChild(fragment, textNode)
    }
  } finally { delete preview.dataset.sbUrlDecorating }
}

function openUrl(url: string) { if (url && window.electronAPI.openExternal) void window.electronAPI.openExternal(url) }
function onPreviewClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  const url = target?.closest<HTMLElement>('[data-url]')?.dataset.url || ''
  if (url) { event.preventDefault(); openUrl(url) }
}
function onPreviewAuxClick(event: MouseEvent) {
  if (!event.metaKey && !event.ctrlKey) return
  const target = event.target as HTMLElement | null
  const url = target?.closest<HTMLElement>('[data-url]')?.dataset.url || ''
  if (url) { event.preventDefault(); openUrl(url) }
}

function applyTheme() {
  if (!editor || !window.OverType?.setTheme) return
  const dark = ui.isDarkMode
  window.OverType.setTheme({ name: dark ? 'dark' : 'lite', colors: {
    bgPrimary: dark ? '#202124' : '#fff', bgSecondary: dark ? '#202124' : '#fff', text: dark ? '#e7e7e7' : '#2f2f2f',
    strong: dark ? '#fff' : '#2f2f2f', link: dark ? '#6fcf97' : '#0b5fff', code: dark ? '#e7e7e7' : '#2f2f2f',
    codeBg: dark ? '#2b2d31' : '#f3f3f3', blockquote: dark ? '#a8adb7' : '#666', hr: dark ? '#4a4d54' : '#dedada',
    syntaxMarker: dark ? '#a8adb7' : '#666', cursor: dark ? '#fff' : '#2f2f2f', selection: dark ? 'rgba(111,207,151,.44)' : 'rgba(11,95,255,.34)',
  } })
}

onMounted(async () => {
  if (!useTiptap && (!host.value || !window.OverType)) return
  if (useTiptap) return
  const OverType = window.OverType
  const result = new OverType(host.value, {
    value: editorStore.body, fontSize: '16px', lineHeight: 1.6, padding: '16px', toolbar: true, placeholder: 'Notes...',
    onChange: (value: string) => editorStore.setBody(value),
  })
  editor = (Array.isArray(result) ? result[0] : result) as OverTypeEditor | null
  editor?.setValue?.(editorStore.body)
  applyTheme()
  preview = editor?.container?.querySelector<HTMLElement>('.overtype-preview') || null
  preview?.addEventListener('click', onPreviewClick)
  preview?.addEventListener('auxclick', onPreviewAuxClick)
  urlObserver = preview ? new MutationObserver(decorateUrls) : null
  urlObserver?.observe(preview!, { childList: true, subtree: true, characterData: true })
  decorateUrls()
  themeObserver = new MutationObserver(applyTheme)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  await nextTick()
})

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  urlObserver?.disconnect()
  preview?.removeEventListener('click', onPreviewClick)
  preview?.removeEventListener('auxclick', onPreviewAuxClick)
  preview = null
  if (editor?.destroy) editor.destroy()
  else if (window.OverType?.destroyAll) window.OverType.destroyAll()
  editor = null
})

function setBody(value: string) {
  editorStore.setBody(value)
  if (!useTiptap) editor?.setValue?.(value)
}

function setExternalBody(value: string) {
  if (useTiptap) tiptap.value?.setExternalBody(value)
  else editor?.setValue?.(value)
}
function focus() {
  if (useTiptap) tiptap.value?.focus()
  else editor?.textarea?.focus()
}
defineExpose({ setBody, setExternalBody, focus, getTextarea: () => editor?.textarea })
</script>
<template>
  <div v-if="useTiptap" class="card-editor-notes-implementation">
    <RichTextEditor ref="tiptap" :model-value="editorStore.body" @update:model-value="setBody" />
  </div>
  <div v-else id="cardEditorOverType" ref="host">
  </div>
</template>
