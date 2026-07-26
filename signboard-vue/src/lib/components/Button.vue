<script setup lang="ts">
import { nextTick, onMounted, ref, toRaw } from "vue";
import { useSlots } from "vue";
import { computed, useAttrs } from "vue";
import Tooltip from "./Tooltip.vue";
import type { ButtonSize, ButtonVariant } from "../../types";

defineOptions({
  inheritAttrs: false,
});

// REGION: STATE

const props = defineProps<{
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: any;
  iconProps?: any;
  iconColor?: string;
  type?: string;
  circular?: boolean;
  disabled?: boolean;
  loading?: boolean;
  href?: string;
  showAlert?: boolean;
  autofocus?: boolean;
  activated?: boolean;
  title?: string;
  tooltip?: string;
}>();

const slots = useSlots();
const attrs = useAttrs();
const elRef = ref<HTMLElement>();

const componentType = computed(() => {
  const { href } = props;

  if (href) {
    return "a";
  }

  return "button";
});

// If there is no slot and there is an icon, it's icon only button
const iconOnly = computed(() => {
  const { icon } = props;
  const content = slots.default?.();
  const hasSlot = content && content[0] && content[0].children !== "";
  return icon && !hasSlot;
});

if (props.autofocus) {
  onMounted(async () => {
    await nextTick();
    elRef.value?.focus();
  });
}
</script>

<template>
  <Tooltip v-if="tooltip" :content="tooltip" placement="top">
    <component
      ref="elRef"
      :is="componentType"
      v-bind="
        href
          ? {
              ...attrs,
              href,
            }
          : attrs
      "
      :class="{
        [size || 'medium']: size,
        button: true,
        [variant || 'primary']: true,
        'icon-button': !!icon,
        'icon-only': iconOnly,
        circular: circular,
        loading: loading,
        activated: activated,
      }"
      :rel="attrs.target === '_blank' ? 'noopener noreferrer' : ''"
      :disabled="disabled || undefined"
      :type="(componentType === 'button' && type) || 'button'"
      :title="title"
    >
      <div class="content">
        <span v-if="loading" class="progress-bar" />
        <span class="text">
          <component
            v-if="icon"
            class="button-icon"
            :class="{ [iconColor || '']: true }"
            :is="toRaw(icon)"
            v-bind="iconProps"
          />
          <span v-if="icon" class="button-label">
            <slot />
          </span>
          <slot v-else />
        </span>
        <span v-if="showAlert" class="alert-dot" />
      </div>
    </component>
  </Tooltip>
  <component
    v-else
    ref="elRef"
    :is="componentType"
    v-bind="
      href
        ? {
            ...attrs,
            href,
          }
        : attrs
    "
    :class="{
      [size || 'medium']: size,
      button: true,
      [variant || 'primary']: true,
      'icon-button': !!icon,
      'icon-only': iconOnly,
      circular: circular,
      loading: loading,
      activated: activated,
    }"
    :rel="attrs.target === '_blank' ? 'noopener noreferrer' : ''"
    :disabled="disabled || undefined"
    :type="(componentType === 'button' && type) || 'button'"
    :title="title"
  >
    <div class="content">
      <span v-if="loading" class="progress-bar" />
      <span class="text">
        <component
          v-if="icon"
          class="button-icon"
          :class="{ [iconColor || '']: true }"
          :is="toRaw(icon)"
          v-bind="iconProps"
        />
        <span v-if="icon" class="button-label">
          <slot />
        </span>
        <slot v-else />
      </span>
      <span v-if="showAlert" class="alert-dot" />
    </div>
  </component>
</template>

<style lang="scss" scoped>
@keyframes outline-appear {
  0% {
    outline: 0;
  }
  100% {
    outline: 2px solid orange;
  }
}

.button {
  text-align: center;
  transition:
    0.15s background,
    0.15s box-shadow;
  /* wrapper has no padding; content handles control sizing */
  padding: 0 !important;
  border: 0;
  font-weight: 500;
  position: relative;
  outline: 0;
  cursor: pointer;
  user-select: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  font-size: $control-font-medium;
  box-sizing: border-box;
  transition: 0.3s all;

  * {
    box-sizing: border-box;
  }

  .button-icon {
    width: auto; //
    height: 1em;
    flex: none;
  }

  &.circular {
    border-radius: 50% !important;
    .content {
      padding: $space * 1.25;
      border-radius: 50% !important;
      box-shadow:
        inset 0px -2px 0px rgba(70, 70, 70, 0.2470588235),
        inset 0 0px 26px rgba(72, 72, 72, 0.1411764706) !important;
    }

    .button-icon {
      width: 1.2rem;
      height: 1.2rem;
    }
  }

  &.icon-only {
    .button-icon {
      margin-right: 0;
      margin-left: 0;
      transform: scale(1.4); ////
    }
  }

  &.icon-button:not(.icon-only) {
    .content {
      justify-content: flex-start;
    }
  }

  // box-shadow: -3px -10px 12px #ffffff, -3px -5px 6px #ffffff, -10px 0px 15px #ffffff, 3px 10px 12px rgba(0, 0, 0, 0.2);

  &.loading {
    overflow: hidden;
  }

  &.blur {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(48px);
    color: $white;
  }

  &.primary {
    background: $dark-blue;
    color: $white;
  }

  &.secondary {
    background: white;
    border-top: 1px solid color.adjust($dark-grey, $alpha: -0.9);
    border-left: 1px solid color.adjust($dark-grey, $alpha: -0.9);
    border-right: 1px solid color.adjust($dark-grey, $alpha: -0.9);

    .text {
      color: color.mix($dark-grey, white, 90%) !important; ////
    }

    &.activated {
      background: rgb(238, 238, 238); // //
    }
  }

  &[disabled] {
    cursor: auto !important;
    pointer-events: none;

    &.primary {
      background: color.adjust($dark-blue, $alpha: -0.5);

      .content {
        box-shadow: none;
      }
    }

    &.secondary {
      opacity: 0.5; // //

      .content {
        box-shadow: none;
        border-bottom: 1px solid color.adjust($dark-grey, $alpha: -0.9);
      }
    }
  }

  .text {
    transform: translate3d(0px, 0px, 0px);
    transition: 0.1s transform ease-in-out;
    position: relative;
    z-index: 2;
    white-space: nowrap;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: $space;
  }

  .button-label {
    line-height: 1;
  }

  .icon {
    position: absolute;
    right: $space * 2;
    top: 0;
    bottom: 0;
    margin: auto;
  }

  .alert-dot,
  .alert-tick {
    border: 2px solid $white;
    position: absolute;
    top: -2px;
    right: -2px;
    box-sizing: content-box !important;
  }

  .alert-tick {
    width: 1.2em;
    height: 1.2em;
    display: flex;
    align-items: center;
    justify-content: center;

    top: 4px;
    right: 8px;

    background: black;

    padding: $space-xs;
    border-radius: 50%;

    ::v-deep(path) {
      /* fill: white; */

      stroke: white;
    }
  }

  &.plain {
    width: auto;
    padding: 0;
    background: transparent;
    border-radius: 0;
  }

  &.small,
  &.smaller {
    width: auto;
    font-size: 14px; //
    line-height: 1rem;

    .content {
      // height: auto;
      padding: $space;
    }

    .button-icon {
      margin: 0;
    }

    &.icon-only {
      .button-icon {
        margin: 0;
      }
    }
  }

  &.small {
    .content {
      font-size: 12px; //
      padding-bottom: $space * 1; //
      padding-top: $space * 0.75;
    }

    // .button-icon {
    //   transform: scale(0.7);
    // }
  }

  &.tiny {
    font-size: 12px;
    width: auto;

    .content {
      padding-bottom: $space * 0.5;
      padding-top: $space * 0.5;
      padding-left: $space-xs;
      padding-right: $space-xs;
    }

    .button-icon {
      transform: scale(1) translateY(-1px); ////
      transform-origin: 50% 50%; //
    }

    &.icon-only {
      .button-icon {
        margin-right: 0px;
      }
    }
  }

  &.smaller {
    line-height: 1.2rem;

    .content {
      height: auto;
      padding: $space * 1.5;
    }
  }

  &.big {
    line-height: 1.2rem;
    font-size: 18px;

    .content {
      height: auto;
      padding: $space * 2.5;
    }
  }

  .content {
    position: relative;
    display: flex;
    width: 100%;
    height: 100%;
    padding: $control-pad-y-medium $control-pad-x-medium;
    align-items: center;
    justify-content: center;

    border-radius: 5px;
    transition: 0.13s ease-in-out;
    z-index: 1;
  }

  &.primary {
    .content {
      // box-shadow: inset 0px -4px 0px #dddddd, 0px -4px 0px #f4f5f6;
      box-shadow:
        inset 0px -4px 0px #46464692,
        inset 0 0px 26px #4848484a;
    }
  }

  &.secondary {
    .content {
      // transparent border needed for solid transition, so the content does not jump around
      border-bottom: 1px solid transparent;
      box-shadow:
        inset 0px -3px 0px #97979726,
        inset 0 0px 26px #a9a9a924;
    }
  }

  &.danger {
    /* background: $secondary-red; */
    background: #ad4e4e;
    color: white;
  }

  &:active {
    box-shadow: none;

    .content {
      box-shadow:
        inset 0px 0px 0px rgba(0, 0, 0, 0.304),
        inset 0 5px 26px #000000ab;

      .text {
        transform: translate3d(0px, 2px, 0px) scale(0.95);
      }
    }

    &.secondary {
      .content {
        border-bottom: 1px solid color.adjust($dark-grey, $alpha: -0.9);
        box-shadow:
          inset 0px 0px 0px #46464600,
          inset 0 0px 26px #48484816;
      }
    } //

    &.plain {
      .content {
        box-shadow: none;
      }
    }
  }
}

// TODO: maybe move to <ProgressButton>
@keyframes progress-active {
  0% {
    opacity: 0.3;
    width: 0;
  }

  100% {
    opacity: 0;
    width: 100%;
  }
}

.progress-bar {
  width: 100%;
  height: 100%;
  display: inline-block;
  position: absolute;
  top: 0;
  left: 0;
  background: $dark-blue;

  transition: 0.4s width;
  will-change: width;

  &::after {
    content: "";
    opacity: 0;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #fff;
    border-radius: 0.28571429rem;
    animation: progress-active 2s ease infinite;
  }
}

.button.secondary .progress-bar {
  background: color.adjust(color.adjust($light-grey, $lightness: -10%), $alpha: -0.5);
}

//

.button.tiny.icon-only.circular {
  width: $space * 4;
}
</style>
