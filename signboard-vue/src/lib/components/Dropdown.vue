<script lang="ts">
import {
  defineComponent,
  ref,
  watch,
  Teleport,
  onMounted,
  reactive,
  nextTick,
  computed,
} from "vue";
import { useEventListener, useFullOutsideClick } from "../utils/event";
// import AppearTransition from "/@/components/transitions/AppearTransition.vue";
// import SlideUpTransition from "/@/components/transitions/SlideUpTransition.vue";

let dropdownInstanceCounter = 0;

export default defineComponent({
  components: {
    // AppearTransition,
    // SlideUpTransition,
    Teleport: Teleport as any, // alias to avoid TS errors
  },
  props: {
    isStyled: Boolean,
    contentClass: String,
    toggleOnEnter: {
      type: Boolean,
      default: () => true,
    },
    maxHeight: Number,
    yOffset: Number,
    xOffset: Number,
    width: Number, // override default width
    triggerClass: String,
    onOpen: Function,
    onClose: Function,
    onDown: Function,
    onUp: Function,
    onEnter: Function,
    teleport: [Boolean, Object],
    padding: {
      type: Boolean,
      default: () => true,
    },
    isVisible: Boolean,
    scrollingElSelector: String,
    position: {
      type: String as () => "bottom" | "top" | "right" | "auto",
      default: () => "bottom",
    },
    horizontalPosition: {
      type: String as () => "right" | "center" | "left" | "auto",
      default: () => "right",
    },
    openOnClick: {
      type: Boolean,
      default: () => true,
    },
    closeOnWindowBlur: {
      type: Boolean,
      default: () => false,
    },
    /**
     * When `overlay` is true, a semi-transparent background overlay
     * is rendered in a Teleport to #overlays (or whichever element
     * you desire). Clicking the overlay will close the dropdown.
     */
    overlay: {
      type: Boolean,
      default: false,
    },
    testId: String,
  },

  setup(props) {
    const dropdownContentOwner = `dropdown-${++dropdownInstanceCounter}`;
    const currentPosition = ref(props.position);
    const isOpen = ref(false);

    // used only in teleport (JS positioning to avoid layering problems)
    const coordinates = reactive({
      top: 0,
      left: 0,
      width: 0,
    });

    const triggerRef = ref<HTMLElement>();
    const wrapperRef = ref<HTMLElement>();
    const contentRef = ref<HTMLElement>();

    watch(isOpen, (newValue) => {
      if (newValue) {
        props.onOpen?.();
      } else {
        setTimeout(() => {
          props.onClose?.();
        }, 10);
      }
    });

    useFullOutsideClick({
      onOutside: () => {
        if (!isOpen.value) return;
        close();
      },
      targetRef: wrapperRef,
      teleportSelectors: props.teleport
        ? [`.dropdown-content[data-dropdown-owner="${dropdownContentOwner}"]`]
        : undefined,
    });

    // === Teleport positioning logic
    if (props.teleport) {
      const measurePositions = () => {
        const el = wrapperRef.value as HTMLElement;
        if (!isOpen.value || !el) return;

        const pos = el.getBoundingClientRect();
        const viewportPadding = 8;

        coordinates.width = props.width || pos.width;

        if (props.position === "right") {
          currentPosition.value = "right";
          coordinates.left = pos.right + (props.xOffset || 0);
          coordinates.top = pos.top + (props.yOffset || 0);
        } else {
          const leftAlignedLeft = pos.left;
          const rightAlignedLeft = pos.left - coordinates.width + pos.width;
          const centerAlignedLeft =
            pos.left - coordinates.width / 2 + pos.width / 2;

          if (props.horizontalPosition === "right") {
            coordinates.left = rightAlignedLeft;
          } else if (props.horizontalPosition === "center") {
            coordinates.left = centerAlignedLeft;
          } else if (props.horizontalPosition === "auto") {
            const rightOverflow =
              rightAlignedLeft +
              coordinates.width +
              viewportPadding -
              window.innerWidth;
            const leftOverflow = viewportPadding - leftAlignedLeft;
            coordinates.left =
              rightOverflow <= leftOverflow ? rightAlignedLeft : leftAlignedLeft;
          } else {
            coordinates.left = leftAlignedLeft;
          }

          if (props.xOffset) {
            coordinates.left += props.xOffset;
          }

          const spaceBelow = window.innerHeight - pos.bottom;
          const shouldOpenTop =
            props.position === "top" ||
            (props.position === "auto" && spaceBelow < 300);

          currentPosition.value = shouldOpenTop ? "top" : "bottom";

          coordinates.top = shouldOpenTop
            ? pos.top - (props.yOffset || 0)
            : pos.bottom + (props.yOffset || 0);
        }

        const maxLeft = window.innerWidth - coordinates.width - viewportPadding;
        const minLeft = viewportPadding;
        const safeMaxLeft = Math.max(minLeft, maxLeft);
        coordinates.left = Math.min(
          Math.max(coordinates.left, minLeft),
          safeMaxLeft,
        );

        const contentHeight = contentRef.value?.getBoundingClientRect().height || 0;
        const maxTop =
          props.position === "right" && contentHeight
            ? window.innerHeight - contentHeight - viewportPadding
            : window.innerHeight - viewportPadding;
        const minTop = viewportPadding;
        const safeMaxTop = Math.max(minTop, maxTop);
        coordinates.top = Math.min(Math.max(coordinates.top, minTop), safeMaxTop);
      };

      watch(isOpen, () => {
        nextTick(measurePositions);
      });

      onMounted(measurePositions);

      useEventListener(
        () =>
          props.scrollingElSelector
            ? document.querySelector(props.scrollingElSelector)!
            : window,
        "scroll",
        measurePositions,
      );

      useEventListener(
        () => window,
        "click",
        async () => {
          await nextTick();
          measurePositions();
        },
      );
    }

    watch(
      () => props.isVisible,
      (newVal) => {
        isOpen.value = newVal;
      },
    );

    const open = () => {
      isOpen.value = true;
    };

    const close = async () => {
      isOpen.value = false;
      const trigger = triggerRef.value;
      if (!trigger) return;

      try {
        trigger.focus({ preventScroll: true });
      } catch {
        trigger.focus();
      }
    };

    const toggle = () => {
      if (isOpen.value) {
        close();
      } else {
        open();
      }
    };

    const teleportTargetSelector = computed(() => {
      const wrapperEl = wrapperRef.value;
      if (!wrapperEl) {
        return "#dropdowns";
      }

      const modal = document.querySelector(".modal");
      if (modal && modal.contains(wrapperEl)) {
        return "#dropdowns-within-modals";
      }

      return "#dropdowns";
    });

    const isWithinModalTeleport = computed(
      () => teleportTargetSelector.value === "#dropdowns-within-modals",
    );

    const contentStyle = computed(() => {
      if (!props.teleport) {
        return `width: ${props.width}px`;
      }

      const transform = currentPosition.value !== "top" ? "transform: none;" : "";
      const zIndex = isWithinModalTeleport.value ? "z-index: 1001;" : "";

      return `position: fixed; top: ${coordinates.top}px; left: ${coordinates.left}px; width: ${coordinates.width}px; bottom: auto; right: auto; ${zIndex} ${transform}`;
    });

    if (props.closeOnWindowBlur) {
      useEventListener(
        () => window,
        "blur",
        () => {
          isOpen.value = false;
        },
      );
    }

    return {
      isOpen,
      wrapperRef,
      contentRef,
      coordinates,
      close,
      toggle,
      open,
      triggerRef,
      currentPosition,
      dropdownContentOwner,
      // SlideUpTransition,
      // AppearTransition,
      teleportTargetSelector,
      contentStyle,
    };
  },
});
</script>

<template>
  <div
    ref="wrapperRef"
    class="dropdown"
    :class="{ styled: isStyled }"
    :data-testid="testId ? `${testId}-trigger` : undefined"
  >
    <!-- Trigger -->
    <div
      role="button"
      tabindex="0"
      ref="triggerRef"
      class="dropdown-trigger"
      :class="[triggerClass]"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      :data-testid="testId"
      @keydown.enter="
        () => {
          toggle();
          onEnter?.({ close, open });
        }
      "
      @keydown.down="
        () => {
          if (!isOpen) {
            open();
          }
          onDown?.({ close, open });
        }
      "
      @keydown.up="() => onUp?.({ close, open })"
      @click="() => (openOnClick ? toggle() : undefined)"
    >
      <slot name="trigger" :open="open" :close="close" :isOpen="isOpen" />
    </div>

    <!-- The dropdown content (transition + teleport if needed) -->
    <div>
      <component
        :is="teleport ? 'Teleport' : 'div'"
        v-if="isOpen"
        :to="typeof teleport === 'boolean' ? teleportTargetSelector : teleport"
      >
        <div
          ref="contentRef"
          class="dropdown-content"
          :data-dropdown-owner="dropdownContentOwner"
          :style="contentStyle"
          :class="{
            styled: isStyled,
            [currentPosition]: true,
            [horizontalPosition]: true,
            padding: padding === true,
          }"
          :data-testid="testId ? `${testId}-content` : undefined"
        >
          <slot name="content" :close="close" :open="open" />
        </div>
      </component>
    </div>
    <!-- Overlay (only appears if overlay=true and dropdown is open) -->
    <div v-if="overlay && isOpen">
      <Teleport to="#overlays">
        <div class="dropdown-overlay" @click="close"></div>
      </Teleport>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dropdown {
  position: relative;
}

// Dropdown trigger active state
.dropdown-trigger:active {
  transform: scale(0.95);
}

// Dropdown trigger control sizing
.dropdown-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  font-size: $control-font-medium;
  padding: $control-pad-y-medium $control-pad-x-medium;
  width: 100%;
}
.dropdown-trigger.tiny {
  font-size: $control-font-tiny;
  padding: $control-pad-y-tiny $control-pad-x-tiny;
}
.dropdown-trigger.smaller {
  font-size: $control-font-smaller;
  padding: $control-pad-y-smaller $control-pad-x-smaller;
}
.dropdown-trigger.small {
  font-size: $control-font-small;
  padding: $control-pad-y-small $control-pad-x-small;
}
.dropdown-trigger.medium {
  font-size: $control-font-medium;
  padding: $control-pad-y-medium $control-pad-x-medium;
}
.dropdown-trigger.big {
  font-size: $control-font-big;
  padding: $control-pad-y-big $control-pad-x-big;
}

.dropdown-content {
  position: absolute;
  bottom: 0px;
  transform: translateY(110%);
  z-index: $z-index-dropdown;
  right: 0;
  background: $white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: $space-xs;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 400px;
  background: white;
  overflow: hidden;

  &.padding {
    padding: $space;
  }

  @media (max-width: $mobile-breakpoint) {
    width: 300px;
    max-width: 90vw;
  }

  &.top {
    transform: translateY(calc(-100% - 40px));
  }

  &.left {
    left: 0;
  }

  // &.center {
  //   right: auto;
  //   left: 50%;
  //   transform: translateY(100%) translateX(-50%);
  //   &.top {
  //     transform: translateY(calc(-70px)) translateX(-50%);
  //   }
  // }
}

/* The overlay that appears behind the dropdown when overlay is true. */
.dropdown-overlay {
  position: fixed;
  /* Make sure this z-index is above your dropdown’s z-index. */
  z-index: $z-index-dropdown + 1;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.15);
}
</style>
