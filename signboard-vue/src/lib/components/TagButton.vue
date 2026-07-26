<script setup lang="ts">
type TabVariant = "segmented" | "underlined";

const props = defineProps<{
  active?: boolean;
  onClick?: () => void;
  variant?: TabVariant;
}>();
</script>

<template>
  <button
    type="button"
    class="tab-button"
    :class="[props.variant || 'underlined', { active: props.active }]"
    @click="props.onClick"
  >
    <slot />
  </button>
</template>

<style lang="scss" scoped>
.tab-button {
  font: inherit;
  cursor: pointer;
}

.tab-button.underlined {
  display: inline-flex;
  align-items: center;
  gap: $space-xs;
  padding: 0 0 $space;
  margin-right: $space;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: $grey;
  font-weight: 600;
}

.tab-button.underlined.active {
  color: $dark-grey;
  border-bottom-color: $dark-grey;
}

.tab-button.segmented {
  border: 0;
  background: transparent;
  padding: $space-xs $space;
  color: rgba(0, 0, 0, 0.68);
  min-width: 110px;
}

.tab-button.segmented + .tab-button.segmented {
  border-left: 1px solid rgba(0, 0, 0, 0.1);
}

.tab-button.segmented.active {
  background: rgba(0, 0, 0, 0.04);
  color: $almost-black;
  font-weight: 600;
}
</style>
