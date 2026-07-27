<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

type Callback = () => void

const props = withDefaults(defineProps<{
  once?: boolean
  renderImmediately?: boolean
  root?: HTMLElement | null
  height?: number
  yMargin?: number
  xMargin?: number
  threshold?: number
  onRender?: Callback
  onEnter?: Callback
  onLeave?: Callback
}>(), {
  once: false,
  renderImmediately: false,
  root: null,
  height: 0,
  yMargin: 200,
  xMargin: 0,
  threshold: 0,
})

const shouldRender = ref(props.renderImmediately)
const isVisible = ref(shouldRender.value)
const minHeight = ref(Math.max(0, props.height))
const elRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

function getRootMargin() {
  return `${props.yMargin}px ${props.xMargin}px ${props.yMargin}px ${props.xMargin}px`
}

function render() {
  if (shouldRender.value) return
  shouldRender.value = true
  void nextTick(() => props.onRender?.())
}

function handleEnter() {
  props.onEnter?.()
  render()
  if (props.once) observer?.disconnect()
}

function handleLeave() {
  isVisible.value = false
  props.onLeave?.()
}

watch(shouldRender, async (rendered) => {
  if (!rendered) return
  await nextTick()
  const renderedElement = elRef.value?.firstElementChild
  if (renderedElement instanceof HTMLElement) {
    minHeight.value = renderedElement.getBoundingClientRect().height
  }
})

onMounted(() => {
  if (shouldRender.value) {
    void nextTick(() => props.onRender?.())
    return
  }

  if (typeof IntersectionObserver === 'undefined') {
    render()
    return
  }

  observer = new IntersectionObserver(([entry]) => {
    isVisible.value = Boolean(entry?.isIntersecting)
    if (entry?.isIntersecting) {
      handleEnter()
    } else {
      handleLeave()
    }
  }, {
    root: props.root || null,
    rootMargin: getRootMargin(),
    threshold: props.threshold,
  })

  if (elRef.value) observer.observe(elRef.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="elRef" class="lazy-card" :style="minHeight ? { minHeight: `${minHeight}px` } : undefined">
    <slot v-if="shouldRender" :did-render="shouldRender" :is-visible="isVisible" />
    <slot v-else name="fallback" />
  </div>
</template>
