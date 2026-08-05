<script setup lang="ts">
import { useAttrs } from "vue";

const { content, placement, as, popperClass } = defineProps<{
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
  as?: string;
  popperClass?: string;
}>();

const attrs = useAttrs();
</script>

<template>
  <component
    :is="as || 'div'"
    v-tooltip="{
      content,
      placement: placement || 'top',
      delay: { show: 200, hide: 200 },
      popperClass,
    }"
  >
    <slot v-bind="attrs" />
  </component>
</template>
