<script setup lang="ts">
import { useAttrs } from "vue";

const { content, placement } = defineProps<{
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
}>();

const attrs = useAttrs();
</script>

<template>
  <div
    v-tooltip="{
      content,
      placement: placement || 'top',
      delay: { show: 200, hide: 200 },
    }"
  >
    <slot v-bind="attrs" />
  </div>
</template>
