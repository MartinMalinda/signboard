<script lang="ts" setup>
import Button from "./Button.vue";
import Close from "./Close.vue";

defineProps<{
  theme?: "light" | "dark" | "grey" | "dark-grey" | "outline";
  size?: "small" | "smaller" | "medium" | "tiny";
}>();
</script>
<template>
  <Button
    class="close-button"
    :class="{ [theme || 'light']: true }"
    :variant="
      theme === 'dark' ? 'primary' : theme === 'outline' ? 'secondary' : 'plain'
    "
    :size="size"
  >
    <div class="foo"></div>
    <Close
      :class="[size, 'close']"
      :stroke="theme === 'grey' ? '#8A8A8A' : undefined"
    />
  </Button>
</template>
<style lang="scss" scoped>
.close-button {
  color: white;
  position: relative;
  z-index: 2;

  &.light,
  &.grey {
    box-shadow: none;
    background: none !important;
  }

  &.dark-grey {
    background: $dark-grey;
  }

  &.dark {
    border-radius: 50%;
    overflow: hidden;
    // background: $dark-green;
  }

  &.grey,
  &.dark-grey {
    path {
      fill: $dark-grey;
    }
  }

  &.outline {
    // You can define styles for the outline theme here if needed
  }

  .content {
    box-shadow: none !important;
  }

  /* Let the icon size of the close button follow the font-size (1em) */
  .close {
    width: 1em;
    height: 1em;
  }
}
</style>
