<script setup lang="ts">
import FeatherIcon from '../FeatherIcon.vue'

defineProps<{ onOpen: () => void }>()
</script>
<template>
  <button id="emptyBoardCallToAction" class="empty-board-cta" type="button" title="Select a directory to create a board" aria-label="Select a directory to create a board" @click="onOpen">
    <span class="empty-board-cta-icon" aria-hidden="true"><FeatherIcon name="folder-plus" :size="34" /></span>
    <span class="empty-board-cta-title">Create your first board</span>
    <span class="empty-board-cta-text">Select an empty directory. Signboard will use the directory name as the board name.</span>
  </button>
</template>
