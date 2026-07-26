<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 16 })
type FeatherIcon = { toSvg: (attrs?: Record<string, string | number>) => string }
type FeatherGlobal = { icons?: Record<string, FeatherIcon> }

const svg = computed(() => {
  const feather = (window as Window & { feather?: FeatherGlobal }).feather
  const icon = feather?.icons?.[props.name]
  return icon ? icon.toSvg({ width: props.size, height: props.size, 'stroke-width': 1.8 }) : ''
})
</script>

<template><span class="feather-icon" aria-hidden="true" v-html="svg" /></template>
