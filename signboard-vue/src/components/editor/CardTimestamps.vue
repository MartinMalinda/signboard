<script setup lang="ts">
import { computed } from 'vue'
import { formatCardTimestampDateTime } from '../../../lib/cardTimestamps.js'

const props = defineProps<{ timestamps?: { createdAt?: string; updatedAt?: string } }>()
const created = computed(() => formatCardTimestampDateTime(props.timestamps?.createdAt))
const updated = computed(() => formatCardTimestampDateTime(props.timestamps?.updatedAt))
</script>
<template>
  <div id="cardEditorTimestampMetadata" class="cardEditorTimestampMetadata" aria-label="Card timestamps">
    <span v-if="created" class="cardEditorTimestampItem"><span class="cardEditorTimestampLabel">Created</span> <time class="cardEditorTimestampValue">{{ created }}</time></span>
    <span v-if="updated" class="cardEditorTimestampItem"><span class="cardEditorTimestampLabel">Updated</span> <time class="cardEditorTimestampValue">{{ updated }}</time></span>
  </div>
</template>
