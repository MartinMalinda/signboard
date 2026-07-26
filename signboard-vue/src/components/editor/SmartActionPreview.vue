<script setup lang="ts">
import type { SmartCardActionResult } from '../../types'
import { normalizePreview } from '../../../lib/smartActions.js'
const props = defineProps<{ result: SmartCardActionResult; action: Record<string, unknown>; onApply: () => void; onBack: () => void }>()
const preview = normalizePreview(props.result, props.action)
</script>
<template>
  <div class="card-editor-smart-action-result">
    <p class="card-editor-ai-tasks-title">{{ preview.label }}</p>
    <div v-if="preview.answer" class="card-editor-smart-action-preview">{{ preview.answer }}</div>
    <div v-else-if="preview.title" class="card-editor-smart-action-preview">{{ preview.title }}</div>
    <ul v-else-if="preview.tasks.length" class="card-editor-ai-tasks-list"><li v-for="task in preview.tasks" :key="task">{{ task }}</li></ul>
    <div v-else-if="preview.labels.length" class="card-editor-smart-action-preview">{{ preview.labels.join(', ') }}</div>
    <div v-else-if="preview.due" class="card-editor-smart-action-preview">Suggested due date: {{ preview.due }}</div>
    <ul v-else-if="preview.attachments.length" class="card-editor-ai-tasks-list"><li v-for="attachment in preview.attachments" :key="String(attachment.url)">{{ attachment.title || attachment.url }}</li></ul>
    <div v-else class="card-editor-smart-action-preview">{{ preview.body }}</div>
    <div class="card-editor-ai-tasks-actions">
      <button v-if="!preview.readOnly" type="button" class="card-editor-ai-tasks-primary" @click="props.onApply">Apply</button>
      <button type="button" class="card-editor-ai-tasks-secondary" @click="props.onBack">Back</button>
    </div>
  </div>
</template>
