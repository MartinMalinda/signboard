<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  computed,
  ref,
  Teleport,
  watch,
} from "vue";
import ModalInner from "./ModalInner.vue";
import { useEventListener } from "../utils/event";
import {
  focusSafely,
  getModalFocusableElements,
  isTopAccessibleModal,
  setBackgroundInert,
} from "../../../lib/accessibility.js";

defineOptions({ inheritAttrs: false });

export interface ModalProps {
  onClose: () => void;
  zIndex?: number;
  overflow?: boolean;
  top?: number;
  left?: number;
  allowScroll?: boolean;
  overlay?: boolean;
  position?: "below" | "above";
  positioning?: "anchored" | "fixed";
  size?: "small" | "large";
  yOffset?: number;
  id?: string;
  modalClass?: string;
  ariaLabel?: string;
  labelledBy?: string;
  initialFocus?: string;
  ariaModal?: boolean;
  showChrome?: boolean;
}

const props = withDefaults(
  defineProps<
    ModalProps & {
      to?: string | null;
      isOpen: boolean;
      isCssHidden?: boolean;
      transition?: boolean;
    }
  >(),
  {
    to: "#modals",
    isOpen: false,
    isCssHidden: false,
    transition: true,
    allowScroll: false,
    overlay: true,
    overflow: false,
    position: "below",
    positioning: "anchored",
    yOffset: 0,
    size: "small",
    zIndex: 1000,
    id: "modalEditCard",
    modalClass: "",
    ariaLabel: "",
    labelledBy: "",
    initialFocus: "",
    ariaModal: true,
    showChrome: true,
  },
);

const modalInnerRef = ref<InstanceType<typeof ModalInner> | null>(null);
let opener: HTMLElement | null = null;

const teleportTarget = computed(() => {
  if (props.to === null) return null;
  if (typeof document === "undefined") return props.to || "body";
  return document.querySelector(props.to) ? props.to : "body";
});

function getDialog() {
  if (props.id) return document.getElementById(props.id);
  const element = modalInnerRef.value?.$el;
  return element instanceof HTMLElement
    ? element.querySelector<HTMLElement>('[role="dialog"]')
    : null;
}

function focusInitial() {
  const dialog = getDialog();
  if (!dialog) return;
  const target = props.initialFocus
    ? dialog.querySelector<HTMLElement>(props.initialFocus)
    : null;
  focusSafely(target || getModalFocusableElements(dialog)[0] || dialog);
}

function activate() {
  const dialog = getDialog();
  if (!dialog) return;
  opener =
    document.activeElement instanceof HTMLElement &&
    !dialog.contains(document.activeElement)
      ? document.activeElement
      : opener;
  dialog.removeAttribute("hidden");
  dialog.setAttribute("aria-hidden", "false");
  setBackgroundInert(dialog);
  void nextTick(focusInitial);
}

function deactivate() {
  const dialog = getDialog();
  if (!dialog) return;
  dialog.setAttribute("aria-hidden", "true");
  dialog.setAttribute("hidden", "");
  setBackgroundInert(null);
  const previousOpener = opener;
  opener = null;
  if (previousOpener?.isConnected) {
    void nextTick(() => focusSafely(previousOpener));
  }
}

function onKeydown(event: KeyboardEvent) {
  if (!props.isOpen) return;
  const dialog = getDialog();
  if (!dialog || !isTopAccessibleModal(dialog)) return;
  if (event.key === "Escape") {
    event.preventDefault();
    props.onClose();
    return;
  }
  if (event.key !== "Tab") return;
  const elements = getModalFocusableElements(dialog);
  if (!elements.length) {
    event.preventDefault();
    focusSafely(dialog);
    return;
  }
  const first = elements[0] || dialog;
  const last = elements[elements.length - 1] || dialog;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    focusSafely(last);
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    focusSafely(first);
  }
}

onMounted(() => {
  document.addEventListener("keydown", onKeydown);
  if (props.isOpen) activate();
});

watch(
  () => props.isOpen,
  (isOpen, wasOpen) => {
    if (isOpen && !wasOpen) {
      void nextTick(activate);
    } else if (!isOpen && wasOpen) {
      deactivate();
    }
  },
);

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeydown);
  setBackgroundInert(null);
  if (opener?.isConnected) focusSafely(opener);
});

const mouseX = ref(typeof window !== "undefined" ? window.innerWidth / 2 : 0);
const mouseY = ref(typeof window !== "undefined" ? window.innerHeight / 2 : 0);

useEventListener(
  () => window,
  "mousedown",
  (event: MouseEvent) => {
    mouseX.value = event.clientX;
    mouseY.value = event.clientY;
  },
);
</script>

<template>
  <component :is="to === null ? 'div' : Teleport" :to="to === null ? undefined : teleportTarget">
    <Transition :name="transition ? 'modal-pop' : undefined">
      <ModalInner
        ref="modalInnerRef"
        v-if="isOpen"
        v-bind="$attrs"
        :id="id"
        :class="modalClass"
        :style="isCssHidden ? { display: 'none' } : undefined"
        :is-css-hidden="isCssHidden"
        :is-open="isOpen"
        :on-close="onClose"
        :z-index="zIndex"
        :mouse-y="mouseY"
        :mouse-x="mouseX"
        :yOffset="yOffset"
        :overflow="overflow"
        :position="position"
        :positioning="positioning"
        :overlay="!isCssHidden && overlay"
        :allow-scroll="allowScroll"
        :top="top"
        :left="left"
        :size="size"
        :aria-label="ariaLabel || undefined"
        :aria-labelledby="labelledBy || undefined"
        :aria-modal="ariaModal"
        :show-chrome="showChrome"
      >
        <template #header>
          <slot name="header" />
        </template>
        <slot />
        <template #close>
          <slot name="close" />
        </template>
      </ModalInner>
    </Transition>
  </component>
</template>

<style lang="scss" scoped></style>
