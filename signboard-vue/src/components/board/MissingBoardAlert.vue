<script setup lang="ts">
import { ref } from 'vue'
import type { DirectorySelection } from '../../types'
import FeatherIcon from '../FeatherIcon.vue'

const props = defineProps<{ boardPath: string; onLocate: (selection: string | DirectorySelection) => Promise<boolean>; onRemove: () => Promise<void> }>()
const busy = ref(false)
const label = props.boardPath.replace(/\/+$/, '').split('/').filter(Boolean).pop() || 'Board'
async function locate() {
  if (busy.value) return
  const selection = await window.chooser.pickDirectory({ defaultPath: props.boardPath.replace(/\/+$/, '') })
  if (!selection) return
  busy.value = true
  try { await props.onLocate(selection) } finally { busy.value = false }
}
async function remove() { if (!busy.value) { busy.value = true; try { await props.onRemove() } finally { busy.value = false } } }
</script>

<template>
  <section class="board-missing-alert" role="alert">
    <span class="board-missing-alert-icon" aria-hidden="true"><FeatherIcon name="alert-triangle" :size="30" /></span>
    <h2 class="board-missing-alert-title">Board folder was moved or renamed</h2>
    <p class="board-missing-alert-message">Signboard could not find this board folder anymore:</p>
    <code class="board-missing-alert-path">{{ boardPath.replace(/\/+$/, '') }}</code>
    <div class="board-missing-alert-actions"><button class="board-missing-alert-remove" type="button" :disabled="busy" @click="remove">Remove Board</button><button class="board-missing-alert-locate" type="button" :disabled="busy" @click="locate">Locate Board</button></div>
    <span class="sr-only">{{ label }}</span>
  </section>
</template>
