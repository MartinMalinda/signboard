<script setup lang="ts">
import { NodeViewWrapper } from "@tiptap/vue-3";

defineProps<{
  deleteNode: () => void;
  node: {
    attrs: {
      src?: string;
      alt?: string;
      title?: string;
    };
  };
  selected: boolean;
}>();
</script>

<template>
  <NodeViewWrapper
    as="figure"
    class="rich-text-image-node"
    :class="{ selected }"
    data-drag-handle
  >
    <button
      v-if="selected"
      type="button"
      class="rich-text-image-delete"
      @mousedown.prevent
      @click="deleteNode"
      aria-label="Delete image"
      title="Delete image"
    >
      <span class="rich-text-image-delete-glyph">×</span>
    </button>
    <img
      :src="node.attrs.src"
      :alt="node.attrs.alt || ''"
      :title="node.attrs.title || ''"
      draggable="false"
    />
  </NodeViewWrapper>
</template>

<style scoped lang="scss">
.rich-text-image-node {
  position: relative;
  display: block;
  margin: $space 0;
  border-radius: 5px;
  transition:
    box-shadow 0.15s ease,
    background-color 0.15s ease;

  img {
    display: block;
    max-width: 100%;
    height: auto;
    border-radius: 8px;
  }

  &.selected {
    background-color: rgba(55, 126, 255, 0.08);
    box-shadow: 0 0 0 2px rgba(55, 126, 255, 0.35);
  }
}

.rich-text-image-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 17px;
  height: 17px;
  border: none;
  border-radius: 999px;
  background: rgba(34, 34, 34, 0.82);
  color: white;
  font-size: 13px;
  line-height: 17px;
  padding: 0;
  text-indent: 0;
  cursor: pointer;
  display: grid;
  place-items: center;
  z-index: 2;
}

.rich-text-image-delete-glyph {
  display: inline-block;
  transform: translateY(-1px);
}
</style>
