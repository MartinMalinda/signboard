<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Editor } from '@tiptap/core'
import { Extension, mergeAttributes } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import Blockquote from '@tiptap/extension-blockquote'
import Bold from '@tiptap/extension-bold'
import BulletList from '@tiptap/extension-bullet-list'
import Code from '@tiptap/extension-code'
import CodeBlock from '@tiptap/extension-code-block'
import Document from '@tiptap/extension-document'
import HardBreak from '@tiptap/extension-hard-break'
import Heading from '@tiptap/extension-heading'
import History from '@tiptap/extension-history'
import Italic from '@tiptap/extension-italic'
import Link from '@tiptap/extension-link'
import ListItem from '@tiptap/extension-list-item'
import OrderedList from '@tiptap/extension-ordered-list'
import Paragraph from '@tiptap/extension-paragraph'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import Text from '@tiptap/extension-text'
import { Markdown } from 'tiptap-markdown'
import Button from './Button.vue'
import Input from './Input.vue'
import Modal from './Modal.vue'
import AppPopover from './AppPopover.vue'
import FeatherIcon from '../../components/FeatherIcon.vue'
import BoldIcon from './editor/Bold.vue'
import ItalicIcon from './editor/Italic.vue'
import LinkIcon from './editor/Link.vue'
import { findRawUrls } from '../../../lib/rawUrls.js'
import { isCardLink, isSignboardCardLink, resolveRelativeCardLink } from '../../../lib/cardLinks'
import { codeHighlightExtension } from '../codeHighlight'

const BASE64_IMAGE_PATTERN = /!\[[^\]]*\]\(\s*data:image\/[^)]*\)/gi
const rawUrlPluginKey = new PluginKey('signboardRawUrls')

function sanitizeMarkdown(value: string) {
  return String(value || '').replace(BASE64_IMAGE_PATTERN, '')
}

function createRawUrlDecorations(doc: ProseMirrorNode) {
  const decorations: Decoration[] = []
  doc.descendants((node, pos, parent) => {
    if (!node.isText || !node.text || parent?.type.name === 'codeBlock') return
    if (node.marks.some((mark) => mark.type.name === 'link' || mark.type.name === 'code')) return
    for (const match of findRawUrls(node.text)) {
      const from = pos + match.start
      const to = pos + match.end
      decorations.push(Decoration.inline(from, to, {
        class: 'card-editor-body-url-text',
        'data-url': match.url,
      }))
      decorations.push(Decoration.widget(to, () => {
        const button = document.createElement('button')
        button.type = 'button'
        button.tabIndex = -1
        button.contentEditable = 'false'
        button.className = 'card-editor-body-url-open card-editor-body-url-open-inline'
        button.dataset.url = match.url
        button.title = 'Open URL in browser'
        button.setAttribute('aria-label', 'Open URL in browser')
        button.textContent = '↗'
        return button
      }, { side: 1, key: `${from}:${to}:${match.url}` }))
    }
  })
  return DecorationSet.create(doc, decorations)
}

const rawUrlExtension = Extension.create({
  name: 'signboardRawUrls',
  addProseMirrorPlugins() {
    return [new Plugin({
      key: rawUrlPluginKey,
      state: {
        init: (_, state) => createRawUrlDecorations(state.doc),
        apply: (transaction, oldDecorations) => transaction.docChanged
          ? createRawUrlDecorations(transaction.doc)
          : oldDecorations.map(transaction.mapping, transaction.doc),
      },
      props: {
        decorations: (state) => rawUrlPluginKey.getState(state),
      },
    })]
  },
})

const CardAwareLink = Link.extend({
  renderHTML({ HTMLAttributes }) {
    const href = String(HTMLAttributes.href || '')
    const cardAttributes = isCardLink(href)
      ? { class: 'card-editor-card-link', 'data-card-link': href, 'aria-haspopup': 'menu', 'aria-expanded': 'false' }
      : {}
    return ['a', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, cardAttributes), 0]
  },
})

const props = defineProps<{ modelValue: string; cardPath?: string; onOpenCard?: (path: string, options?: { focusNotes?: boolean; stack?: boolean }) => void | Promise<void> }>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  ready: [editor: Editor]
}>()

const linkModalOpen = ref(false)
const linkModalUrl = ref('')
const linkModalText = ref('')
const savedSelection = ref<{ from: number; to: number } | null>(null)
const cardLinkMenuOpen = ref(false)
const cardLinkOpener = ref<HTMLAnchorElement | null>(null)
const cardLinkMenuTitle = ref('')
const editorHost = ref<HTMLElement | null>(null)
let cardLinkHoverTimer: number | null = null
let cardLinkCloseTimer: number | null = null

const editor = useEditor({
  content: sanitizeMarkdown(props.modelValue),
  autofocus: false,
  extensions: [
    Document,
    Paragraph,
    Text,
    HardBreak,
    History,
    Markdown.configure({
      html: false,
      linkify: false,
      breaks: false,
      tightLists: true,
      bulletListMarker: '-',
    }),
    rawUrlExtension,
    TaskList,
    TaskItem.configure({ nested: true }),
    Bold,
    Italic,
    CardAwareLink.configure({
      openOnClick: false,
      autolink: false,
      linkOnPaste: false,
      protocols: ['signboard'],
      isAllowedUri: (url, context) => isCardLink(url) || context.defaultValidate(url),
    }),
    Heading.configure({ levels: [1, 2, 3] }),
    OrderedList,
    BulletList,
    ListItem,
    Blockquote,
    Code,
    CodeBlock,
    codeHighlightExtension,
  ],
  editorProps: {
    attributes: {
      id: 'cardEditorNotes',
      class: 'card-editor-notes-content',
      'aria-label': 'Card notes',
      'data-testid': 'card-notes-editor',
      spellcheck: 'true',
    },
  },
  onUpdate: ({ editor: nextEditor }) => {
    const markdown = (nextEditor.storage as Editor['storage'] & { markdown?: { getMarkdown: () => string } }).markdown
    emit('update:modelValue', sanitizeMarkdown(markdown?.getMarkdown() || ''))
  },
})

function getMarkdown() {
  const markdown = (editor.value?.storage as Editor['storage'] & { markdown?: { getMarkdown: () => string } }).markdown
  return sanitizeMarkdown(markdown?.getMarkdown() || '')
}

function focus() {
  editor.value?.commands.focus()
}

function setExternalBody(value: string) {
  const nextValue = sanitizeMarkdown(value)
  if (!editor.value || nextValue === getMarkdown()) return
  editor.value.commands.setContent(nextValue, { emitUpdate: false })
}

function openLinkModal() {
  if (!editor.value) return
  const { from, to } = editor.value.state.selection
  linkModalText.value = editor.value.state.doc.textBetween(from, to)
  linkModalUrl.value = editor.value.isActive('link') ? String(editor.value.getAttributes('link').href || '') : ''
  savedSelection.value = { from, to }
  linkModalOpen.value = true
}

function closeLinkModal() {
  if (editor.value && savedSelection.value) editor.value.commands.setTextSelection(savedSelection.value)
  savedSelection.value = null
  linkModalOpen.value = false
}

function applyLink(remove = false) {
  if (!editor.value || !savedSelection.value) return
  const { from, to } = savedSelection.value
  editor.value.commands.setTextSelection({ from, to })
  if (remove || !linkModalUrl.value.trim()) {
    editor.value.chain().focus().unsetLink().run()
  } else {
    editor.value.chain()
      .focus()
      .insertContentAt({ from, to }, linkModalText.value)
      .setTextSelection({ from, to: from + linkModalText.value.length })
      .setLink({ href: linkModalUrl.value.trim() })
      .run()
  }
  closeLinkModal()
}

function openUrl(url: string) {
  if (url && window.electronAPI.openExternal) void window.electronAPI.openExternal(url)
}

function clearCardLinkTimers() {
  if (cardLinkHoverTimer !== null) window.clearTimeout(cardLinkHoverTimer)
  if (cardLinkCloseTimer !== null) window.clearTimeout(cardLinkCloseTimer)
  cardLinkHoverTimer = null
  cardLinkCloseTimer = null
}

function closeCardLinkMenu() {
  clearCardLinkTimers()
  cardLinkOpener.value?.setAttribute('aria-expanded', 'false')
  cardLinkMenuOpen.value = false
}

function showCardLinkMenu(link: HTMLAnchorElement) {
  clearCardLinkTimers()
  cardLinkOpener.value?.setAttribute('aria-expanded', 'false')
  cardLinkOpener.value = link
  cardLinkMenuTitle.value = link.textContent?.trim() || 'Related card'
  link.setAttribute('aria-expanded', 'true')
  cardLinkMenuOpen.value = true
}

function scheduleCardLinkMenu(link: HTMLAnchorElement) {
  clearCardLinkTimers()
  if (cardLinkMenuOpen.value && cardLinkOpener.value === link) return
  cardLinkHoverTimer = window.setTimeout(() => showCardLinkMenu(link), 300)
}

function scheduleCardLinkMenuClose() {
  if (!cardLinkMenuOpen.value) return
  if (cardLinkCloseTimer !== null) window.clearTimeout(cardLinkCloseTimer)
  cardLinkCloseTimer = window.setTimeout(() => {
    cardLinkCloseTimer = null
    closeCardLinkMenu()
  }, 180)
}

function openLinkEditor(link: HTMLAnchorElement) {
  if (!editor.value) return
  const linkHref = link.getAttribute('href') || ''
  const activeLink = link.isConnected
    ? link
    : Array.from(editorHost.value?.querySelectorAll<HTMLAnchorElement>('a[href]') || [])
      .find((candidate) => candidate.getAttribute('href') === linkHref)
  if (!activeLink) return
  const position = editor.value.view.posAtDOM(activeLink, 0)
  editor.value.commands.setTextSelection(position)
  editor.value.chain().focus().extendMarkRange('link').run()
  const { from, to } = editor.value.state.selection
  linkModalText.value = editor.value.state.doc.textBetween(from, to)
  linkModalUrl.value = String(link.getAttribute('href') || '')
  savedSelection.value = { from, to }
  linkModalOpen.value = true
}

function visitCardLink(link = cardLinkOpener.value) {
  if (!link) return
  const href = String(link.getAttribute('href') || '')
  closeCardLinkMenu()
  const relativeCardPath = resolveRelativeCardLink(href, props.cardPath || '')
  if (relativeCardPath && props.onOpenCard) {
    void props.onOpenCard(relativeCardPath, { stack: true })
    return
  }
  openUrl(isSignboardCardLink(href) ? href : link.href || href)
}

function editCardLink() {
  const link = cardLinkOpener.value
  if (!link) return
  closeCardLinkMenu()
  void nextTick(() => openLinkEditor(link))
}

function handleEditorClick(event: MouseEvent) {
  const target = event.target instanceof HTMLElement ? event.target : null
  if (!target || !editor.value) return

  const rawUrlTarget = target.closest<HTMLElement>('[data-url]')
  if (rawUrlTarget) {
    const url = rawUrlTarget.dataset.url || ''
    if (rawUrlTarget.classList.contains('card-editor-body-url-open') || event.metaKey || event.ctrlKey) {
      event.preventDefault()
      openUrl(url)
    }
    return
  }

  const link = target.closest<HTMLAnchorElement>('a[href]')
  if (!link) return
  event.preventDefault()
  const href = String(link.getAttribute('href') || '')
  if (isCardLink(href)) {
    visitCardLink(link)
    return
  }
  const relativeCardPath = resolveRelativeCardLink(href, props.cardPath || '')
  if (relativeCardPath && props.onOpenCard) {
    void props.onOpenCard(relativeCardPath)
    return
  }
  if (isSignboardCardLink(href)) {
    openUrl(href)
    return
  }
  if (event.metaKey || event.ctrlKey) {
    openUrl(link.href)
    return
  }
  openLinkEditor(link)
}

function handleEditorMouseOver(event: MouseEvent) {
  const target = event.target instanceof HTMLElement ? event.target : null
  const link = target?.closest<HTMLAnchorElement>('a.card-editor-card-link')
  if (link) scheduleCardLinkMenu(link)
}

function handleEditorMouseOut(event: MouseEvent) {
  const target = event.target instanceof HTMLElement ? event.target : null
  const link = target?.closest<HTMLAnchorElement>('a.card-editor-card-link')
  if (!link) return
  const nextTarget = event.relatedTarget
  if (nextTarget instanceof Node && link.contains(nextTarget)) return
  if (link === cardLinkOpener.value) scheduleCardLinkMenuClose()
}

onMounted(() => {
  void nextTick(() => {
    const instance = editor.value
    if (!instance) return
    try {
      instance.view.dom.addEventListener('click', handleEditorClick)
      instance.view.dom.addEventListener('mouseover', handleEditorMouseOver)
      instance.view.dom.addEventListener('mouseout', handleEditorMouseOut)
    } catch { return }
    emit('ready', instance)
  })
})

watch(() => props.modelValue, (value) => {
  setExternalBody(value)
})

onBeforeUnmount(() => {
  closeCardLinkMenu()
  const instance = editor.value
  if (!instance) return
  try {
    instance.view.dom.removeEventListener('click', handleEditorClick)
    instance.view.dom.removeEventListener('mouseover', handleEditorMouseOver)
    instance.view.dom.removeEventListener('mouseout', handleEditorMouseOut)
  } catch { /* EditorContent may have unmounted the view already. */ }
  instance.destroy()
})

defineExpose({ setExternalBody, focus, getEditor: () => editor.value, getMarkdown })
</script>

<template>
  <div ref="editorHost" id="cardEditorTiptap" class="card-editor-tiptap">
    <div class="card-editor-tiptap-toolbar" role="toolbar" aria-label="Card notes formatting">
      <button
        type="button"
        class="card-editor-tiptap-tool"
        :class="{ 'is-active': Boolean(editor?.isActive('bold')) }"
        title="Bold"
        aria-label="Bold"
        :aria-pressed="Boolean(editor?.isActive('bold'))"
        @click="editor?.chain().focus().toggleBold().run()"
      ><BoldIcon /></button>
      <button
        type="button"
        class="card-editor-tiptap-tool"
        :class="{ 'is-active': Boolean(editor?.isActive('italic')) }"
        title="Italic"
        aria-label="Italic"
        :aria-pressed="Boolean(editor?.isActive('italic'))"
        @click="editor?.chain().focus().toggleItalic().run()"
      ><ItalicIcon /></button>
      <button
        type="button"
        class="card-editor-tiptap-tool"
        :class="{ 'is-active': Boolean(editor?.isActive('link')) }"
        title="Edit link"
        aria-label="Edit link"
        :aria-pressed="Boolean(editor?.isActive('link'))"
        @click="openLinkModal"
      ><LinkIcon /></button>
      <div class="card-editor-tiptap-toolbar-spacer" aria-hidden="true" />
      <slot name="toolbar-end" />
    </div>
    <EditorContent :editor="editor" />
    <Modal
      id="modalCardEditorLink"
      :is-open="linkModalOpen"
      :on-close="closeLinkModal"
      :overlay="false"
      :to="null"
      positioning="anchored"
      position="above"
      :show-chrome="false"
      aria-label="Edit link"
    >
      <div class="card-editor-link-dialog" @keydown.enter.prevent="applyLink()">
        <label for="cardEditorLinkText">Text</label>
        <Input id="cardEditorLinkText" :value="linkModalText" :on-change="(value: string) => { linkModalText = value }" size="small" />
        <label for="cardEditorLinkUrl">URL</label>
        <Input id="cardEditorLinkUrl" :value="linkModalUrl" :on-change="(value: string) => { linkModalUrl = value }" size="small" type="url" autofocus />
        <div class="card-editor-link-actions">
          <Button size="small" variant="secondary" @click="closeLinkModal">Cancel</Button>
          <Button size="small" variant="secondary" @click="applyLink(true)">Remove</Button>
          <Button size="small" @click="applyLink()">Save link</Button>
        </div>
      </div>
    </Modal>
    <AppPopover
      id="cardEditorCardLinkPopover"
      class-name="card-editor-card-link-popover"
      :is-open="cardLinkMenuOpen"
      :opener="cardLinkOpener"
      :on-close="closeCardLinkMenu"
      :focus-on-open="false"
      :restore-focus="false"
      aria-label="Related card link actions"
    >
      <div class="card-editor-card-link-menu card-drag-frame" @mouseenter="clearCardLinkTimers" @mouseleave="scheduleCardLinkMenuClose">
        <div class="card-editor-card-link-menu-title" :title="cardLinkMenuTitle">
          <span class="card-editor-card-link-menu-title-icon"><FeatherIcon name="file-text" :size="14" /></span>
          <span class="card-editor-card-link-menu-title-text">{{ cardLinkMenuTitle }}</span>
        </div>
        <div class="card-editor-card-link-menu-actions">
          <button class="card-editor-card-link-menu-option" type="button" role="menuitem" @click="editCardLink"><FeatherIcon name="edit-2" :size="14" /><span>Edit</span></button>
          <button class="card-editor-card-link-menu-option" type="button" role="menuitem" @click="() => visitCardLink()"><FeatherIcon name="external-link" :size="14" /><span>Open</span></button>
        </div>
      </div>
    </AppPopover>
  </div>
</template>

<style scoped lang="scss">
.card-editor-tiptap {
  position: relative;
  color: var(--text, inherit);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.card-editor-tiptap-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 35px;
  padding: 2px 0;
  border-bottom: 1px solid var(--border, currentColor);
}

.card-editor-tiptap-toolbar-spacer {
  flex: 1 1 auto;
  min-width: 8px;
}

:deep(.card-editor-tiptap-toolbar-end) {
  display: flex;
  flex: 0 1 auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

:deep(.card-editor-tiptap-toolbar-end::-webkit-scrollbar) {
  display: none;
}

:deep(.card-editor-tiptap-toolbar-end > .v2-editor-toolbar-controls),
:deep(.card-editor-tiptap-toolbar-end > .card-editor-metadata-segment) {
  flex: 0 0 auto;
}

:deep(.card-editor-metadata-segment) {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  padding: 2px;
  border: 1px solid color-mix(in oklab, var(--border, #e6e8ec) 72%, var(--bg-card, #fff));
  border-radius: 8px;
  background: color-mix(in oklab, var(--bg-card, #fff) 96%, var(--border, #e6e8ec));
}

.card-editor-tiptap-tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 30px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  box-shadow: none;
  color: var(--muted, currentColor);
  cursor: pointer;
  line-height: 1;
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
}

.card-editor-tiptap-tool:hover {
  background: color-mix(in oklab, var(--bg-card, transparent) 86%, var(--border, currentColor));
  color: var(--text, currentColor);
}

.card-editor-tiptap-tool:focus-visible {
  outline: 2px solid var(--accent, currentColor);
  outline-offset: 1px;
}

.card-editor-tiptap-tool.is-active {
  border-color: color-mix(in oklab, var(--accent, currentColor) 55%, var(--border, currentColor));
  background: color-mix(in oklab, var(--accent, transparent) 16%, var(--bg-card, transparent));
  color: var(--text, currentColor);
}

:deep(.card-editor-tiptap-tool svg) {
  width: 16px;
  height: 16px;
  stroke-width: 1.8;
}

:deep(.card-editor-tiptap-label-trigger) {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
  min-width: 38px;
  flex: 0 0 auto;
  max-width: min(680px, calc(100vw - 48px));
  height: 26px;
  padding: 0 7px;
  border: 0;
  border-left: 1px solid color-mix(in oklab, var(--border, #e6e8ec) 74%, var(--bg-card, #fff));
  border-radius: 0 6px 6px 0;
  background: transparent;
  box-shadow: none;
  color: var(--text, currentColor);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 550;
  line-height: 1;
}

:deep(.card-editor-tiptap-label-trigger:hover),
:deep(.card-editor-tiptap-label-trigger[aria-expanded='true']) {
  border-left-color: color-mix(in oklab, var(--border, #e6e8ec) 74%, var(--bg-card, #fff));
  background: color-mix(in oklab, var(--accent, #0b5fff) 7%, var(--bg-card, #fff));
  color: var(--text, currentColor);
}

:deep(.card-editor-metadata-segment > .card-editor-tiptap-label-trigger:first-child) {
  border-left: 0;
  border-radius: 6px;
}

:deep(.card-editor-tiptap-label-trigger:focus-visible) {
  outline: 2px solid var(--accent, currentColor);
  outline-offset: 1px;
}

:deep(.card-editor-tiptap-label-trigger.has-labels) {
  color: var(--text, currentColor);
}

:deep(.card-editor-tiptap-label-trigger > .feather-icon) {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
}

:deep(.card-editor-tiptap-label-trigger > .feather-icon:last-child) {
  width: 13px;
  height: 13px;
  flex-basis: 13px;
}

:deep(.card-editor-tiptap-label-trigger > .feather-icon svg) {
  width: 100%;
  height: 100%;
}

:deep(.card-editor-tiptap-label-chip) {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  max-width: 160px;
  height: 22px;
  padding: 0 7px;
  border: 1px solid transparent;
  border-radius: 999px;
  color: var(--text, currentColor);
  font-size: 11px;
  font-weight: 650;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.card-editor-tiptap-label-more) {
  flex: 0 0 auto;
  color: var(--muted, currentColor);
  font-size: 11px;
  white-space: nowrap;
}

:deep(.card-editor-notes-content) {
  height: 100%;
  min-height: 0;
  max-height: none;
  overflow-y: auto;
  padding: 16px var(--card-editor-body-inset, 16px);
  outline: none;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

:deep(.card-editor-notes-content:focus-visible) {
  box-shadow: inset 0 0 0 1px var(--border, currentColor);
}

:deep(.card-editor-notes-content p) { margin: 0 0 0.8em; }
:deep(.card-editor-notes-content h1),
:deep(.card-editor-notes-content h2),
:deep(.card-editor-notes-content h3) { margin: 0 0 0.65em; line-height: 1.3; }
:deep(.card-editor-notes-content ul),
:deep(.card-editor-notes-content ol) { margin: 0 0 0.8em; padding-left: 2em; }
:deep(.card-editor-notes-content ul[data-type='taskList']) { padding-left: 0; list-style: none; }
:deep(.card-editor-notes-content li p) { margin-bottom: 0; }
:deep(.card-editor-notes-content li[data-checked='true'] > div) { text-decoration: line-through; opacity: 0.7; }
:deep(.card-editor-notes-content blockquote) { margin: 0 0 0.8em; padding-left: 0.8em; border-left: 2px solid var(--border, currentColor); }
:deep(.card-editor-notes-content code) { padding: 0.1em 0.25em; border-radius: 3px; background: color-mix(in srgb, currentColor 10%, transparent); }
:deep(.card-editor-notes-content pre) { overflow-x: auto; padding: 0.75em; border-radius: 5px; background: color-mix(in srgb, currentColor 10%, transparent); }
:deep(.card-editor-notes-content pre code) { padding: 0; border-radius: 0; background: transparent; }
:deep(.card-editor-notes-content ul[data-type='taskList'] li) { display: flex; gap: 0.5em; align-items: flex-start; }
:deep(.card-editor-notes-content ul[data-type='taskList'] li > label) { flex: none; margin-top: 0.25em; }
:deep(.card-editor-notes-content ul[data-type='taskList'] input[type='checkbox']) { width: 1.1em; height: 1.1em; }
:deep(.card-editor-notes-content a) { color: var(--link, #0b5fff); text-decoration: underline; }
:deep(.card-editor-notes-content a.card-editor-card-link) {
  display: inline-flex;
  align-items: center;
  gap: 0.28em;
  max-width: 100%;
  padding: 0 0.24em;
  border: 1px solid color-mix(in srgb, var(--link, #0b5fff) 28%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--link, #0b5fff) 8%, transparent);
  text-decoration: none;
  font-size: min(1rem, 1.25em);
  font-weight: 400;
  line-height: 1.25;
  vertical-align: baseline;
  cursor: pointer;
  overflow-wrap: anywhere;
}
:deep(.card-editor-notes-content a.card-editor-card-link)::before {
  content: '▣';
  flex: 0 0 auto;
  font-size: 0.78em;
  opacity: 0.72;
}
:deep(.card-editor-body-url-text) { text-decoration: underline dotted; text-decoration-color: var(--link, currentColor); }

.card-editor-link-dialog {
  display: grid;
  gap: 0.45rem;
  width: min(520px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
  min-width: 0;
  box-sizing: border-box;
  padding: 12px;
  background: var(--bg, Canvas);
  border: 1px solid var(--border, currentColor);
  border-radius: 6px;
}

.card-editor-link-dialog :deep(.input-wrap) { min-width: 0; }

.card-editor-link-actions { display: flex; justify-content: flex-end; gap: 6px; margin-top: 4px; }
</style>
