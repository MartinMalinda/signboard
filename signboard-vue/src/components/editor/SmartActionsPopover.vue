<script setup lang="ts">
import { ref } from 'vue'
import AppPopover from '../../lib/components/AppPopover.vue'
import FeatherIcon from '../FeatherIcon.vue'
import SmartActionPreview from './SmartActionPreview.vue'
import { useEditorStore } from '../../stores/useEditorStore'
import { useSettingsStore } from '../../stores/useSettingsStore'
import type { SmartCardActionResult } from '../../types'

const props = defineProps<{ isOpen: boolean; opener: HTMLElement | null; onClose: () => void }>()
const editor = useEditorStore()
const settings = useSettingsStore()
const active = ref<Record<string, unknown> | null>(null)
const result = ref<SmartCardActionResult | null>(null)
const prompt = ref('')
const target = ref('content')
const pasteText = ref('')
const working = ref(false)
const error = ref('')
function close() { active.value = null; result.value = null; prompt.value = ''; pasteText.value = ''; error.value = ''; props.onClose() }
function begin(action: Record<string, unknown>) { active.value = action; target.value = String(action.target || 'content'); error.value = ''; if (action.type !== 'quick' && action.type !== 'question' && action.type !== 'paste') void run(action) }
async function run(action = active.value) {
  if (!action) return
  if ((action.type === 'quick' || action.type === 'question') && !prompt.value.trim()) return
  if (action.type === 'paste' && !pasteText.value.trim()) return
  working.value = true; error.value = ''
  try {
    const next = await editor.runSmartAction(action, { prompt: prompt.value, target: target.value, pasteText: pasteText.value })
    if (!next || (next as SmartCardActionResult).ok === false) error.value = (next as SmartCardActionResult)?.message || 'Unable to run Smart Card Action.'
    else result.value = next as SmartCardActionResult
  } catch (nextError) { error.value = String(nextError instanceof Error ? nextError.message : nextError) }
  finally { working.value = false }
}
async function apply() { if (active.value && result.value) { await editor.applySmartAction(result.value as Record<string, unknown>, active.value); close() } }
function icon(action: Record<string, unknown>) { return action.type === 'quick' ? 'zap' : action.type === 'question' ? 'help-circle' : action.type === 'title' ? 'type' : action.type === 'labels' ? 'tag' : action.type === 'tasks' ? 'check-square' : action.type === 'paste' ? 'clipboard' : action.target === 'due' ? 'calendar' : action.target === 'attachments' ? 'paperclip' : 'pen-tool' }
</script>
<template>
  <AppPopover id="cardEditorSmartActionsPopover" class-name="card-editor-smart-actions-popover" :is-open="props.isOpen" :opener="props.opener" :on-close="close" aria-label="Smart Card Actions">
    <div v-if="!active" class="card-editor-smart-actions-menu-view">
      <div class="card-editor-smart-actions-header"><p class="card-editor-ai-tasks-title">Smart Card Actions</p><button type="button" class="card-editor-smart-actions-settings" title="Open Smart Actions settings" aria-label="Open Smart Actions settings" @click="settings.open('smart-actions'); close()"><FeatherIcon name="settings" /></button></div>
      <div class="card-editor-smart-actions-menu">
        <button v-for="action in settings.actions" :key="action.id" type="button" class="board-menu-action card-editor-smart-action-button" @click="begin(action as unknown as Record<string, unknown>)"><span class="board-menu-action-icon"><FeatherIcon :name="icon(action as unknown as Record<string, unknown>)" /></span><span class="board-menu-action-label">{{ action.label }}</span></button>
      </div>
    </div>
    <div v-else-if="result" class="card-editor-smart-action-preview-view"><SmartActionPreview :result="result" :action="active" :on-apply="apply" :on-back="() => { result = null }" /></div>
    <div v-else class="card-editor-smart-action-input-view">
      <p class="card-editor-ai-tasks-title">{{ active.label }}</p>
      <textarea v-if="active.type === 'quick' || active.type === 'question'" id="cardEditorQuickSmartActionPrompt" class="card-editor-smart-paste-input" :value="prompt" :placeholder="active.type === 'question' ? 'Ask about this card' : 'Describe what you want this action to do'" @input="prompt = ($event.target as HTMLTextAreaElement).value" />
      <textarea v-if="active.type === 'paste'" class="card-editor-smart-paste-input" placeholder="Paste text here" :value="pasteText" @input="pasteText = ($event.target as HTMLTextAreaElement).value" />
      <label v-if="active.type === 'quick'" class="card-editor-smart-action-field-label" for="cardEditorQuickSmartActionTarget">Affects</label>
      <select v-if="active.type === 'quick'" id="cardEditorQuickSmartActionTarget" class="card-editor-smart-action-target-select" :value="target" @change="target = ($event.target as HTMLSelectElement).value"><option v-for="value in ['title', 'labels', 'content', 'due', 'attachments']" :key="value" :value="value">{{ value }}</option></select>
      <p v-if="working" class="card-editor-ai-tasks-status" role="status">Working...</p><p v-if="error" class="card-editor-ai-tasks-status is-error" role="status">{{ error }}</p>
      <div class="card-editor-ai-tasks-actions"><button type="button" class="card-editor-ai-tasks-primary" :disabled="working" @click="void run()">Run</button><button type="button" class="card-editor-ai-tasks-secondary" @click="active = null">Back</button><button type="button" class="card-editor-ai-tasks-secondary" @click="close">Close</button></div>
    </div>
  </AppPopover>
</template>
