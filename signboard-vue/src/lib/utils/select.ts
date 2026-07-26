import { ref, nextTick, Ref, watchEffect, computed } from "vue";

function getScrollParent(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement;
  while (parent) {
    const overflowY = getComputedStyle(parent).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null; // No scrollable parent found
}

export function useHighlightedItem<T extends { id: string }>(
  items: Ref<T[]>,
  options?: { scrollIntoViewOptions?: ScrollIntoViewOptions },
) {
  const highlightedItem = ref<T | undefined>(undefined) as Ref<T | undefined>;
  const currentIndex = computed(() => {
    return items.value.findIndex(
      (item) => item.id === highlightedItem.value?.id,
    );
  });

  const handleArrowDown = () => {
    if (currentIndex.value < items.value.length - 1) {
      highlightedItem.value = items.value[currentIndex.value + 1];
    } else {
      highlightedItem.value = items.value[0] || undefined; // Loop back to the top
    }
    scrollIntoView();
  };

  const handleArrowUp = () => {
    if (currentIndex.value > 0) {
      highlightedItem.value = items.value[currentIndex.value - 1];
    } else {
      highlightedItem.value = items.value[items.value.length - 1] || undefined; // Loop back to the bottom
    }
    scrollIntoView();
  };

  const scrollIntoView = async (
    overrideOptions?: ScrollIntoViewOptions,
  ) => {
    await nextTick();
    const element = document.querySelector(".highlighted") as HTMLElement;
    if (!element) return;

    const scrollParent = getScrollParent(element);
    if (!scrollParent) return;

    const parentRect = scrollParent.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    const blockOption =
      overrideOptions?.block || options?.scrollIntoViewOptions?.block || "nearest";
    const behavior =
      overrideOptions?.behavior ||
      options?.scrollIntoViewOptions?.behavior ||
      "smooth";

    let scrollOffset: number | null = null;

    if (blockOption === "center") {
      // Center the element within the scroll parent
      const parentCenter = parentRect.top + parentRect.height / 2;
      const elementCenter = elementRect.top + elementRect.height / 2;
      scrollOffset = scrollParent.scrollTop + (elementCenter - parentCenter);
    } else if (blockOption === "nearest") {
      // Scroll the minimum amount necessary to bring the element into view
      if (elementRect.top < parentRect.top) {
        // Element is above the visible area
        scrollOffset =
          scrollParent.scrollTop - (parentRect.top - elementRect.top);
      } else if (elementRect.bottom > parentRect.bottom) {
        // Element is below the visible area
        scrollOffset =
          scrollParent.scrollTop + (elementRect.bottom - parentRect.bottom);
      }
      // If the element is within the visible area, do nothing
    } else if (blockOption === "start") {
      // Align the element to the top of the scroll parent
      scrollOffset =
        scrollParent.scrollTop + (elementRect.top - parentRect.top);
    } else if (blockOption === "end") {
      // Align the element to the bottom of the scroll parent
      scrollOffset =
        scrollParent.scrollTop + (elementRect.bottom - parentRect.bottom);
    }

    if (scrollOffset !== null) {
      scrollParent.scrollTo({
        top: scrollOffset,
        behavior: behavior as ScrollBehavior,
      });
    }
  };

  watchEffect(() => {
    if (
      !highlightedItem.value ||
      (highlightedItem.value &&
        !items.value.find((item) => item.id === highlightedItem.value?.id))
    ) {
      highlightedItem.value = items.value[0] || undefined;
    }
  });

  return {
    highlightedItem,
    handleArrowDown,
    handleArrowUp,
    scrollIntoView,
  };
}
