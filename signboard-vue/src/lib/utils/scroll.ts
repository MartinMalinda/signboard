import { onUnmounted } from "vue";

export function getScrollingElement() {
  return (document.scrollingElement as HTMLElement) || document.documentElement;
}

let scrollLockCount = 0;
let lockedScrollTop = 0;
let lockedScrollLeft = 0;

export function useScrollDisable() {
  let isScrollDisabled = false;

  const disableScroll = () => {
    if (isScrollDisabled) return;

    if (scrollLockCount === 0) {
      lockedScrollTop = window.scrollY;
      lockedScrollLeft = window.scrollX;

      document.body.style.position = "fixed";
      document.body.style.top = `-${lockedScrollTop}px`;
      document.body.style.left = `-${lockedScrollLeft}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    }

    scrollLockCount += 1;
    isScrollDisabled = true;
  };

  const enableScroll = () => {
    if (!isScrollDisabled) return;

    isScrollDisabled = false;
    scrollLockCount = Math.max(0, scrollLockCount - 1);

    if (scrollLockCount > 0) return;

    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.width = "";
    document.body.style.overflow = "";

    window.scrollTo(lockedScrollLeft, lockedScrollTop);
  };

  onUnmounted(enableScroll);

  return { enableScroll, disableScroll };
}
