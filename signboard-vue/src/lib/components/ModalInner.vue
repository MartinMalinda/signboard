<script setup lang="ts">
import type { ModalProps } from "./Modal.vue";
import { useScrollDisable } from "../utils/scroll";
import CloseButton from "./CloseButton.vue";
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps<
  ModalProps & {
    mouseY: number;
    mouseX: number;
    isOpen: boolean;
    isCssHidden?: boolean;
  }
>();
const modalContentRef = ref<HTMLElement | null>(null);
const scaleWrapRef = ref<HTMLElement | null>(null);
const topPosition = ref(0);
const leftPosition = ref(0);
const isDragging = ref(false);
let dragStartX = 0;
let dragStartY = 0;
let startTop = 0;
let startLeft = 0;
let resizeObserver: ResizeObserver;
let resizeRaf: number | null = null;
let anchorX: number | null = null;
let anchorY: number | null = null;

const { enableScroll, disableScroll } = useScrollDisable();
watch(
  () => props.isOpen,
  (isOpen) => {
    if (props.allowScroll) return;
    if (isOpen) disableScroll();
    else enableScroll();
  },
  { immediate: true },
);

const styleObject = computed(() => {
  if (!props.isOpen) return {};

  const originVars = {
    "--origin-x": `${props.mouseX}px`,
    "--origin-y": `${props.mouseY}px`,
  } as Record<string, string>;

  if (props.positioning === "fixed") {
    if (props.size === "large") {
      return {
        position: "fixed" as const,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: props.zIndex || undefined,
        ...originVars,
      };
    }
    return {
      position: "fixed" as const,
      zIndex: props.zIndex || undefined,
      ...originVars,
    };
  }

  if (props.size === "large") {
    return {
      position: "fixed" as const,
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: props.zIndex || undefined,
      ...originVars,
    };
  }
  return {
    position: "absolute" as const,
    top: `${topPosition.value}px`,
    left: `${leftPosition.value}px`,
    zIndex: props.zIndex || undefined,
    ...originVars,
  };
});

const overlayClass = computed(() => {
  return {
    translucent: !props.overlay,
    "overlay-large": props.size === "large",
  };
});

const clampPosition = (top: number, left: number) => {
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const gap = 8;

  const element = modalContentRef.value;
  const rect = element?.getBoundingClientRect();
  const mH = rect?.height || element?.offsetHeight || 0;
  const mW = rect?.width || element?.offsetWidth || 0;
  // Clamp the rendered box. Small modals can have a CSS transform (and the
  // enter transition briefly scales them), so offsetWidth/offsetHeight alone
  // can leave the visible dialog outside the window.
  const computedStyle = element ? window.getComputedStyle(element) : null;
  const logicalLeft = Number.parseFloat(computedStyle?.left || '');
  const logicalTop = Number.parseFloat(computedStyle?.top || '');
  const renderedOffsetX = rect && Number.isFinite(logicalLeft) ? rect.left - logicalLeft : 0;
  const renderedOffsetY = rect && Number.isFinite(logicalTop) ? rect.top - logicalTop : 0;

  const minTop = gap - renderedOffsetY;
  const maxTop = vh - mH - gap - renderedOffsetY;
  const minLeft = gap - renderedOffsetX;
  const maxLeft = vw - mW - gap - renderedOffsetX;

  return {
    top: Math.max(minTop, Math.min(top, maxTop)),
    left: Math.max(minLeft, Math.min(left, maxLeft)),
  };
};

const setPosition = () => {
  if (anchorX === null) {
    anchorX = props.mouseX;
    anchorY = props.mouseY;
  }

  if (props.size === "large") return;

  const baseY = anchorY!;
  const yOffset = props.yOffset || 0;
  const mH = modalContentRef.value?.offsetHeight || 0;
  const posY = props.position;

  let top = posY === "above" ? baseY - mH - yOffset : baseY + yOffset;

  const clamped = clampPosition(top, leftPosition.value);
  topPosition.value = clamped.top;

  const baseX = anchorX!;
  const mW = modalContentRef.value?.offsetWidth || 0;
  const vw = window.innerWidth;
  const gap = 8;
  const isRightQuarterClick = baseX >= vw * 0.75;

  let left = isRightQuarterClick
    ? baseX - mW / 2
    : baseX + mW + gap > vw
      ? baseX - mW - gap
      : baseX + gap;

  const clampedH = clampPosition(topPosition.value, left);
  leftPosition.value = clampedH.left;
};

onMounted(async () => {
  await nextTick();
  if (props.isOpen) setPosition();

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      if (resizeRaf != null) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = null;
        setPosition();
      });
    });

    if (modalContentRef.value) {
      resizeObserver.observe(modalContentRef.value);
    }
  }

  window.addEventListener("resize", setPosition);
});

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) void nextTick(setPosition);
  },
);

function onHeaderMouseDown(e: MouseEvent) {
  if (e.button !== 0) return;
  if (props.size === "large") return;

  const target = e.target as HTMLElement;
  if (target.closest("button, a, input, select, textarea")) return;

  e.preventDefault();

  isDragging.value = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  startTop = topPosition.value;
  startLeft = leftPosition.value;

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value) return;

  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;

  const next = clampPosition(startTop + dy, startLeft + dx);
  topPosition.value = next.top;
  leftPosition.value = next.left;
}

function onMouseUp() {
  isDragging.value = false;

  anchorX = leftPosition.value;
  anchorY = topPosition.value;

  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
}

onUnmounted(() => {
  resizeObserver?.disconnect();
  window.removeEventListener("resize", setPosition);
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
});
</script>

<template>
  <div
    class="modal-wrap"
    :class="{ 'is-hidden': props.isCssHidden }"
    :style="{ zIndex: props.zIndex || undefined }"
  >
    <div
      v-if="isOpen && !props.isCssHidden"
      class="overlay"
      :class="overlayClass"
      @click="() => onClose()"
      @scroll.prevent
    />
    <div
      ref="modalContentRef"
      v-bind="$attrs"
      class="modal"
      role="dialog"
      tabindex="-1"
      :id="props.id"
      :hidden="!isOpen"
      :aria-hidden="!isOpen"
      :aria-modal="props.ariaModal === false ? 'false' : 'true'"
      :aria-label="props.ariaLabel || undefined"
      :aria-labelledby="props.labelledBy || undefined"
      :class="{
        'is-dragging': isDragging,
        [size || 'small']: true,
        overflow: overflow || size === 'large',
        hidden: !isOpen,
      }"
      :style="styleObject"
    >
      <div ref="scaleWrapRef" class="modal-scale-wrap">
        <div
          v-if="showChrome"
          class="top-row"
          :class="{ 'modal-drag-handle': size !== 'large' }"
          @mousedown="onHeaderMouseDown"
        >
          <div class="top-row-content">
            <slot name="close">
              <CloseButton
                theme="grey"
                aria-label="Back"
                size="small"
                class="close"
                @click="onClose"
              />
            </slot>
            <div class="header">
              <slot name="header" />
            </div>
          </div>
        </div>
        <div class="modal-content">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$mobile-nav-bar-height: 55px;
$aspect-ratio: 0.99038;
$background-size: 200px;
$spacing-y: $space * 3;

@keyframes appear {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 0.72;
  }
}

.close {
  position: relative;
  z-index: 11;

  :deep(.content) {
    padding-left: $space-xs;
    padding-right: $space-xs;
  }
}

.header:not(:empty) {
  top: 0;
  left: 0;
  width: 100%;
  padding: $space $space * 2 $space 0;
  color: $dark-grey;
  font-weight: 500;
  box-sizing: border-box;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}

.modal-wrap {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  display: block;
  z-index: 2;
}

.modal-wrap.is-hidden {
  pointer-events: none;
}

.top-row {
  position: relative;

  .top-row-content {
    display: none;
    position: relative;
    z-index: 11;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border);
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }

  .modal.large .top-row-content {
    background: var(--bg-card);
    cursor: default;
    border-bottom-color: var(--border);
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }
}

.modal-drag-handle {
  cursor: grab;
  user-select: none;
}

.modal.is-dragging .modal-drag-handle {
  cursor: grabbing;
}

.left {
  width: $space * 2;
  transform: scale(1.5, 1.5);
}

.overlay {
  position: absolute;
  z-index: 1;
  width: 140%;
  height: 140vh;
  background: var(--bg);
  opacity: 0;
  top: -10px;

  animation: 240ms appear forwards;

  filter: blur(5px);

  @media (max-width: $mobile-breakpoint) {
    height: calc(100%);
  }

  &.translucent {
    animation: none;
  }

  &.overlay-large {
    background: var(--bg);
    opacity: 0.72;
    animation: 240ms appear forwards;
  }
}

.modal {
  position: relative;
  z-index: 2;
  box-sizing: border-box;
  max-width: min(100%, calc(100vw - 16px));
  max-height: calc(100vh - 16px);
  min-width: 0;
  box-shadow:
    0 24px 60px color-mix(in oklab, var(--text) 18%, transparent),
    0 2px 8px color-mix(in oklab, var(--text) 10%, transparent);

  background: var(--bg-card);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 18px;
  text-align: left;
  padding: 0;

  &.small {
    min-width: min(300px, calc(100vw - 16px));
  }

  &.large {
    width: 660px;
    max-height: calc(100vh - 32px);
  }

  &.transparent {
    background: transparent;
    box-shadow: none;
    height: auto;

    .modal-content {
      height: auto;
    }
  }

  &.overflow {
    .modal-content {
      max-height: calc(100vh - 90px);
      overflow-y: auto;
      overflow-x: hidden;
      overscroll-behavior-y: none;
    }
  }
}

.modal[hidden],
.modal.hidden {
  display: none !important;
}

.modal-content {
  box-sizing: border-box;
  width: 100%;
  height: auto;
  min-width: 0;
  position: relative;
  z-index: 12;
}

:global(.modal-pop-enter-active) .modal {
  transition: opacity 120ms ease-out 40ms;
  will-change: opacity;
}

:global(.modal-pop-enter-from) .modal {
  opacity: 0;
}

:global(.modal-pop-enter-to) .modal {
  opacity: 1;
}

:global(.modal-pop-leave-active) .modal {
  transition: opacity 100ms ease-in;
}

:global(.modal-pop-leave-from) .modal {
  opacity: 1;
}

:global(.modal-pop-leave-to) .modal {
  opacity: 0;
}

.modal.small {
  transform-origin: var(--origin-x) var(--origin-y);
  will-change: transform;
}

:global(.modal-pop-enter-active) .modal.small,
:global(.modal-pop-leave-active) .modal.small {
  transition: transform 160ms cubic-bezier(0.2, 0.9, 0.2, 1);
}

:global(.modal-pop-enter-from) .modal.small,
:global(.modal-pop-leave-to) .modal.small {
  transform: translateY(4px) scale(0.96);
}

:global(.modal-pop-enter-to) .modal.small,
:global(.modal-pop-leave-from) .modal.small {
  transform: translateY(0) scale(1);
}

.modal-scale-wrap {
  transform-origin: 50% 50%;
  will-change: transform;
  display: block;
  width: 100%;
  contain: layout paint;
  backface-visibility: hidden;
  transform: translateZ(0);
}

:global(.modal-pop-enter-active) .modal.large .modal-scale-wrap,
:global(.modal-pop-leave-active) .modal.large .modal-scale-wrap {
  transition: transform 160ms cubic-bezier(0.2, 0.9, 0.2, 1);
}

:global(.modal-pop-enter-from) .modal.large .modal-scale-wrap,
:global(.modal-pop-leave-to) .modal.large .modal-scale-wrap {
  transform: scale(0.98);
}

:global(.modal-pop-enter-to) .modal.large .modal-scale-wrap,
:global(.modal-pop-leave-from) .modal.large .modal-scale-wrap {
  transform: scale(1);
}
</style>
<style lang="scss">
.logged-in {
  .modal:not(.full):not(.large) {
    transform: translateX(125px);
  }
}

.sidebar-minimized {
  .modal:not(.large) {
    transform: translateX(34px);
  }
}
</style>
