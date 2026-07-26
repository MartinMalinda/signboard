<script setup lang="ts">
const { stroke } = defineProps<{
  stroke?: string;
}>();
</script>
<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25">
    <path
      fill="#5f6368"
      :stroke="stroke || 'currentColor'"
      stroke-linecap="round"
      stroke-width="3.2"
      d="M0 0 17.4 18.2M0 18.2 17.4 0"
      transform="translate(4 3.6)"
    />
  </svg>
</template>
