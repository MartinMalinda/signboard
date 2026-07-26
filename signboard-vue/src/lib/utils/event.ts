import { onBeforeUnmount, onMounted, ref } from "vue";
import type { Ref } from "vue";

type EventCallback<TEvent extends Event> = (event: TEvent) => void;

export function useEventListener<TEvent extends Event>(
  getTarget: () => Element | Window | Document,
  type: string,
  cb: EventCallback<TEvent>,
) {
  onMounted(() => {
    const target = getTarget();
    if (!target) {
      throw new Error(`Failed to set listener ${type}, element not found`);
    }

    target.addEventListener(type, cb as EventListener);
  });

  onBeforeUnmount(() => {
    const target = getTarget();
    if (!target) {
      console.error(`Failed to remove ${type}, element not found`);
      return;
    }

    target.removeEventListener(type, cb as EventListener);
  });
}

export function useModifierKeys() {
  const isMetaActive = ref(false);
  const isShiftActive = ref(false);

  const downHandler = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey) {
      isMetaActive.value = true;
    }
    if (event.shiftKey) {
      isShiftActive.value = true;
    }
  };

  const upHandler = (event: KeyboardEvent) => {
    if (!event.metaKey && !event.ctrlKey) {
      isMetaActive.value = false;
    }
    if (!event.shiftKey) {
      isShiftActive.value = false;
    }
  };

  useEventListener(() => window, "keydown", downHandler);
  useEventListener(() => window, "keyup", upHandler);

  return { isMetaActive, isShiftActive };
}

let escapeCallbacks: (() => void)[] = [];
let escapeEventSetup = false;
export function useEscapeQueue(cb: () => void) {
  if (!escapeEventSetup) {
    onMounted(() => {
      escapeEventSetup = true;
      window.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.code === "Escape" && escapeCallbacks.length) {
          const lastCallback = escapeCallbacks.pop() as () => void;
          lastCallback();
        }
      });
    });
  }

  escapeCallbacks.push(cb);
  onBeforeUnmount(() => {
    escapeCallbacks = escapeCallbacks.filter((_cb) => _cb !== cb);
  });
}

/**
 * Options for the useFullOutsideClick composable.
 */
interface UseFullOutsideClickOptions {
  /**
   * The reference to the element to detect outside clicks for.
   */
  targetRef: Ref<HTMLElement | undefined>;

  /**
   * Callback to execute when a full outside click is detected.
   */
  onOutside: () => void;

  /**
   * Optional selector(s) for teleportation or Shadow DOM handling.
   */
  teleportSelectors?: string | string[];
}

/**
 * useFullOutsideClick
 *
 * Listens for mousedown and mouseup events and triggers a callback
 * only when both events occur outside the target element.
 *
 * @param options - Configuration options for the composable
 */
export function useFullOutsideClick(options: UseFullOutsideClickOptions) {
  const { targetRef, onOutside, teleportSelectors } = options;

  // Reactive references to track if mousedown and mouseup are outside
  const mouseDownOutside = ref(false);
  const mouseUpOutside = ref(false);

  /**
   * Determines whether the event occurred outside the target element,
   * considering teleportation and Shadow DOM if selectors are provided.
   *
   * @param event - The event to check
   * @returns boolean indicating if the event is outside
   */
  const isEventOutside = (event: Event): boolean => {
    const target = event.target as Node;
    const outsideOfDOM = !document.contains(target);

    if (outsideOfDOM) {
      return false; // Click occurred outside the entire DOM
    }

    const element = targetRef.value;
    if (!element) {
      return true; // If no target element, consider it as outside
    }

    if (element.contains(target)) {
      return false; // Click occurred inside the target element
    }

    // Handle teleportation and Shadow DOM
    if (teleportSelectors) {
      const selectors = Array.isArray(teleportSelectors)
        ? teleportSelectors
        : [teleportSelectors];

      for (const selector of selectors) {
        const teleportTargets =
          typeof selector === "string"
            ? Array.from(document.querySelectorAll(selector))
            : [];

        if (teleportTargets.find((el) => el.contains && el.contains(target))) {
          return false;
        }

        // if (teleportTarget instanceof HTMLElement) {

        //   // Check Shadow DOM if applicable
        //   const shadowContent = teleportTarget.shadowRoot?.querySelector(
        //     ".dropdown-content"
        //   );
        //   if (shadowContent?.contains(target)) {
        //     return false;
        //   }
        // }
      }
    }

    return true; // Click occurred outside the target and teleport areas
  };

  /**
   * Handler for mousedown events.
   *
   * @param event - The mousedown event
   */
  const handleMouseDown = (event: MouseEvent) => {
    mouseDownOutside.value = isEventOutside(event);
  };

  /**
   * Handler for mouseup events.
   *
   * @param event - The mouseup event
   */
  const handleMouseUp = (event: MouseEvent) => {
    mouseUpOutside.value = isEventOutside(event);

    // If both mousedown and mouseup are outside, trigger the callback
    if (mouseDownOutside.value && mouseUpOutside.value) {
      onOutside();
    }

    // Reset the flags
    mouseDownOutside.value = false;
    mouseUpOutside.value = false;
  };

  // Use useEventListener to handle mousedown and mouseup
  useEventListener(() => document, "mousedown", handleMouseDown);
  useEventListener(() => document, "mouseup", handleMouseUp);
}

export interface UseStrictClickOptions {
  /** The maximum distance in pixels that can be moved for the action to be considered a valid click */
  maxDistance?: number;
}

/**
 * A composable to detect a strict "click" based on pointer events.
 * The click is considered valid only if:
 * - The pointer never moves more than `maxDistance` pixels away from the initial point.
 * - The pointer does not leave the element between mousedown and mouseup.
 *
 * @param callback - The function to call if the click is valid.
 *                   It receives the MouseEvent (or PointerEvent) and any additional arguments.
 * @param options - Options for the composable, such as maxDistance.
 *
 * @returns An object containing onMouseDown, onMouseMove, onMouseUp, and onMouseLeave event handlers.
 */
export function useStrictClick<Args extends unknown[]>(
  callback: (event: MouseEvent, ...args: Args) => void,
  options: UseStrictClickOptions = {},
) {
  const { maxDistance = 10 } = options;
  // Record the starting pointer position.
  const startPos = ref<{ x: number; y: number } | null>(null);
  // Flag indicating if the click should be disqualified.
  const disqualified = ref(false);

  const onMouseDown = (event: MouseEvent) => {
    startPos.value = { x: event.clientX, y: event.clientY };
    disqualified.value = false;
  };

  const onMouseMove = (event: MouseEvent) => {
    // If we've already disqualified the click, no need to check further.
    if (disqualified.value || !startPos.value) {
      return;
    }
    const dx = event.clientX - startPos.value.x;
    const dy = event.clientY - startPos.value.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > maxDistance) {
      disqualified.value = true;
    }
  };

  const onMouseLeave = () => {
    // Disqualify the click if the pointer leaves the element.
    disqualified.value = true;
  };

  const onMouseUp = (event: MouseEvent, ...args: Args) => {
    if (!startPos.value || disqualified.value) {
      // Reset the state and do nothing if the click was disqualified.
      startPos.value = null;
      return;
    }
    // Otherwise, trigger the callback.
    callback(event, ...args);
    startPos.value = null;
  };

  return { onMouseDown, onMouseMove, onMouseUp, onMouseLeave };
}

export const waitForVisible = (signal?: AbortSignal) => {
  if (document.visibilityState === "visible") return Promise.resolve();

  return new Promise<void>((resolve) => {
    const onChange = () => {
      if (document.visibilityState === "visible") {
        cleanup();
        resolve();
      }
    };
    const onAbort = () => {
      cleanup();
      resolve(); // resolve to let the task loop continue/exit gracefully
    };
    const cleanup = () => {
      document.removeEventListener("visibilitychange", onChange);
      signal?.removeEventListener("abort", onAbort);
    };

    document.addEventListener("visibilitychange", onChange);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
};
