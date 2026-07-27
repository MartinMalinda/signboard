<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
} from "vue";

export enum SupportedInputTypes {
  Text = "text",
  Password = "password",
  Email = "email",
  Textarea = "textarea",
}

function focusWithoutScroll(element: HTMLElement | null) {
  if (element) {
    const x = window.scrollX;
    const y = window.scrollY;
    element.focus();
    window.scrollTo(x, y);
  }
}

export interface InputElEvent extends InputEvent {
  target: HTMLInputElement | HTMLTextAreaElement;
}

export const inputProps = {
  onChange: {
    type: Function,
    default: () => {},
  },
  onFocus: {
    type: Function,
    default: () => {},
  },
  onKeyDown: {
    type: Function,
    default: () => {},
  },
  onBlur: {
    type: Function,
    default: () => {},
  },

  size: {
    type: String as () => "medium" | "small" | "smaller" | "tiny",
    default: "medium",
  },
  label: String,
  type: {
    type: String,
    default: SupportedInputTypes.Text,
  },
  name: {
    type: String,
  },
  inputClass: [String],
  value: String,
  placeholder: String,
  autosize: Boolean,
  maxlength: Number,
  readonly: Boolean,
  max: Number,
  min: Number,
  autofocus: Boolean,
  inputmode: String,
  disabled: Boolean,
  style: String,
  onEnter: {
    type: Function,
    default: () => {},
  },
  onMetaEnter: {
    type: Function,
    default: () => {},
  },
  allowClear: Boolean,
};

export default defineComponent({
  props: inputProps,
  setup(props) {
    const isTextarea = props.type === SupportedInputTypes.Textarea;
    const componentType = isTextarea ? "textarea" : "input";
    const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null);

    const resizeTextarea = () => {
      if (!isTextarea || !props.autosize || !inputRef.value) return;
      const textarea = inputRef.value as HTMLTextAreaElement;
      textarea.style.height = "auto";
      const maxHeight = Number.parseFloat(textarea.style.maxHeight || "");

      if (Number.isFinite(maxHeight) && textarea.scrollHeight > maxHeight) {
        textarea.style.overflowY = "auto";
        textarea.style.height = `${maxHeight}px`;
        return;
      }

      textarea.style.overflowY = "hidden";
      textarea.style.height = `${textarea.scrollHeight}px`;
    };

    const onInput = (event: InputElEvent) => {
      const { value } = event.target;
      props.onChange(value, event);
      resizeTextarea();
    };
    const onKeydownInternal = (event: KeyboardEvent) => {
      props.onKeyDown(event);

      if (event.key !== "Enter") return;

      if (event.metaKey) {
        props.onMetaEnter(event);
        return;
      }

      // Keep native newline behavior for textarea (Enter / Shift+Enter).
      if (isTextarea) return;

      event.preventDefault();
      props.onEnter(event);
    };
    const isEmpty = computed(
      () => (!props.value || props.value.length === 0) && props.value !== "0",
    );

    // Handler for dragover event to allow drop
    const onDragOver = (event: DragEvent) => {
      event.preventDefault();
      // Optionally, you can add visual feedback here
    };

    // Handler for drop event to process the image
    const onDrop = (event: DragEvent) => {
      event.preventDefault();
      // const files = event.dataTransfer?.files;
      event.dataTransfer?.items[0]?.getAsString((src) => {
        // this is called when you drag an image from HTML document
        props.onChange(src, event as any);
      });
      // if (files && files.length > 0) {
      //   const file = files[0];
      //   // this triggers when you drag image from a computer
      //   if (file.type.startsWith("image/")) {
      //     const reader = new FileReader();
      //     reader.onload = () => {
      //       const src = reader.result as string;
      //       alert(src);
      //       // Insert the image src into the input value
      //       props.onChange(src, event as any);
      //     };
      //     reader.readAsDataURL(file);
      //   } else {
      //     // Optionally, handle non-image files
      //     console.warn("Dropped file is not an image.");
      //   }
      // }
    };

    // Prevent default dragover and drop behavior globally
    const preventDefaultHandler = (e: DragEvent) => {
      e.preventDefault();
    };

    if (props.autofocus) {
      onMounted(() => {
        // Add a slight async timeout so that it does not open on IPhone, where it causes glitches.
        setTimeout(() => {
          if (inputRef.value) {
            focusWithoutScroll(inputRef.value);
          }
        }, 0);
      });
    }

    onMounted(() => {
      resizeTextarea();
    });

    watch(
      () => props.value,
      () => {
        void nextTick(() => resizeTextarea());
      },
    );

    window.addEventListener("dragover", preventDefaultHandler);
    window.addEventListener("drop", preventDefaultHandler);
    onBeforeUnmount(() => {
      window.removeEventListener("dragover", preventDefaultHandler);
      window.removeEventListener("drop", preventDefaultHandler);
    });

    return {
      componentType,
      onInput,
      isEmpty,
      onDragOver,
      onDrop,
      inputRef,
      resizeTextarea,
      onKeydownInternal,
      handleLabelClick() {
        if (inputRef.value) {
          focusWithoutScroll(inputRef.value);
        }
      },
    };
  },
  components: {},
});
</script>

<template>
  <div
    v-bind="$attrs"
    class="input-wrap"
    @dragover.prevent.stop="onDragOver"
    @drop.prevent.stop="onDrop"
  >
    <label v-if="label" :for="name" @click="handleLabelClick">{{
      label
    }}</label>
    <component
      :is="componentType"
      :style="style"
      :id="name"
      ref="inputRef"
      :name="name"
      :value="value"
      :max="max"
      :min="min"
      :maxlength="maxlength"
      :placeholder="placeholder"
      :inputmode="inputmode"
      :disabled="disabled"
      :readonly="readonly"
      :class="{
        [size]: true,
        [inputClass || '']: inputClass,
        empty: isEmpty,
      }"
      v-bind="componentType === 'input' ? { type } : {}"
      @keydown="onKeydownInternal"
      v-on="{
        focus: onFocus,
        blur: onBlur,
        input: onInput,
      }"
    />
  </div>
</template>

<style lang="scss" scoped>
.input-wrap {
  position: relative;

  .clear-button {
    background: white !important;
    position: absolute;
    right: -$space * 4;
    top: 50%;
    transform: translateY(-50%) scale(0.9);
    z-index: 4;
  }

  ::v-deep(.clear-button .content) {
    padding: $space;
  }

  input,
  textarea {
    height: $control-height-medium;
    font-size: $control-font-medium;
    padding: $control-pad-y-medium $control-pad-x-medium;
    width: 100%;
    outline: 0;
    border-radius: 5px;
    border: 0;
    background: white;
    border: 1px solid $whity;
    color: $dark-grey;
    font-size: 15px;
    margin: 0;
    line-height: 1.5;
    box-sizing: border-box;

    &.tiny {
      height: $control-height-tiny;
      font-size: $control-font-tiny;
      padding: $control-pad-y-tiny $control-pad-x-tiny;
    }
    &.smaller {
      height: $control-height-smaller;
      font-size: $control-font-smaller;
      padding: $control-pad-y-smaller $control-pad-x-smaller;
    }
    &.small {
      height: $control-height-small;
      font-size: $control-font-small;
      padding: $control-pad-y-small $control-pad-x-small;
    }
    &.big {
      height: $control-height-big;
      font-size: $control-font-big;
      padding: $control-pad-y-big $control-pad-x-big;
    }

    @media (max-width: $mobile-breakpoint) {
      font-size: 16px; // iOS Safari pretty much requires 16px to not zoom in
    }

    &[disabled] {
      color: $dark-grey;

      -webkit-text-fill-color: $dark-grey; // Mobile Safari needs this
      opacity: 1; // Mobile Safari needs this
    }

    &::placeholder {
      color: $grey;
    }
  }

  input {
    /* Single-line inputs should keep control-height line-height for vertical centering. */
    line-height: $control-height-medium;

    &.tiny {
      line-height: $control-height-tiny;
    }
    &.smaller {
      line-height: $control-height-smaller;
    }
    &.small {
      line-height: $control-height-small;
    }
    &.big {
      line-height: $control-height-big;
    }
  }

  textarea {
    min-height: $control-height-medium;
    height: auto;

    &.tiny {
      min-height: $control-height-tiny;
    }
    &.smaller {
      min-height: $control-height-smaller;
    }
    &.small {
      min-height: $control-height-small;
    }
    &.big {
      min-height: $control-height-big;
    }
  }

  label {
    display: block;
    color: $dark-grey;
    font-size: 0.85rem;
    font-weight: 500;
    line-height: 1.2;
    margin-bottom: $space-xs;
  }
}

textarea {
  resize: vertical;
  field-sizing: content;
  max-height: 500px;
}
</style>
