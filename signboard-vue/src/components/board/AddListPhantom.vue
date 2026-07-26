<script setup lang="ts">
import FeatherIcon from '../FeatherIcon.vue'

const props = defineProps<{ onAdd?: (afterPath?: string) => void }>()
function activate() { props.onAdd?.() }
</script>
<template>
  <section class="list add-list-phantom" role="button" aria-label="Add new list" tabindex="0" @click="activate" @keydown.enter.prevent="activate" @keydown.space.prevent="activate"><div class="add-list-phantom-content"><span class="add-list-phantom-icon"><FeatherIcon name="plus" /></span><span class="add-list-phantom-label">Add list</span></div></section>
</template>
