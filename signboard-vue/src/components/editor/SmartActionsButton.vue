<script setup lang="ts">
import { ref } from 'vue'
import FeatherIcon from '../FeatherIcon.vue'
import SmartActionsPopover from './SmartActionsPopover.vue'
import { useSettingsStore } from '../../stores/useSettingsStore'
const settings = useSettingsStore()
const open = ref(false)
const button = ref<HTMLElement | null>(null)
const model = settings.appSettings.ai.ollama.model || 'Ollama'
</script>
<template>
  <div class="card-editor-smart-actions-wrap">
    <button id="cardEditorSmartActionsButton" ref="button" type="button" class="card-editor-smart-actions-button" :disabled="!settings.appSettings.ai.enabled" :title="`Smart Card Actions with ${model}`" :aria-label="`Smart Card Actions with ${model}`" :aria-expanded="open" @click="open = !open"><FeatherIcon name="zap" /></button>
    <SmartActionsPopover :is-open="open" :opener="button" :on-close="() => { open = false }" />
  </div>
</template>
