// Accessibility helpers used by the canonical Vue renderer.

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[contenteditable="plaintext-only"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export const MODAL_FOCUSABLE_SELECTOR = FOCUSABLE_SELECTOR;

const state = {
  activeModal: null,
  openers: new WeakMap(),
  initialized: false,
};

function visible(element) {
  if (!(element instanceof HTMLElement) || element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

export function isElementActuallyVisible(element) {
  return visible(element);
}

function focusable(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
    .filter((element) => element instanceof HTMLElement && !element.hasAttribute('disabled') && visible(element));
}

export function getModalFocusableElements(container) {
  return container instanceof HTMLElement ? focusable(container) : [];
}

export function focusSafely(element) {
  if (!(element instanceof HTMLElement)) return false;
  try { element.focus({ preventScroll: true }); } catch { element.focus(); }
  return true;
}

function focusInitial(modal, initialFocus) {
  const requested = typeof initialFocus === 'string' ? modal.querySelector(initialFocus) : initialFocus;
  const target = requested instanceof HTMLElement && visible(requested) ? requested : focusable(modal)[0] || modal;
  if (target === modal && !modal.hasAttribute('tabindex')) modal.setAttribute('tabindex', '-1');
  return focusSafely(target);
}

function openModals() {
  return Array.from(document.querySelectorAll('[role="dialog"]'))
    .filter((element) => element instanceof HTMLElement && element.getAttribute('aria-modal') !== 'false' && !element.classList.contains('hidden') && element.getAttribute('aria-hidden') !== 'true' && visible(element));
}

export function getOpenAccessibleModals() {
  return openModals();
}

export function isTopAccessibleModal(modal) {
  const modals = openModals();
  return modals[modals.length - 1] === modal;
}

function refreshInert(activeModal) {
  if (!document.body) return;
  for (const child of Array.from(document.body.children)) {
    if (!(child instanceof HTMLElement)) continue;
    const modalLayer = child.hasAttribute('data-sb-modal-layer');
    const keepInteractive = activeModal && (child === activeModal || child.contains(activeModal) || modalLayer);
    if (activeModal && !keepInteractive) {
      if (!child.hasAttribute('data-sb-modal-inert')) child.setAttribute('data-sb-modal-inert', child.inert ? 'existing' : 'added');
      child.inert = true;
    } else {
      const inertState = child.getAttribute('data-sb-modal-inert');
      if (inertState) {
        if (inertState === 'added') child.inert = false;
        child.removeAttribute('data-sb-modal-inert');
      }
    }
  }
}

export function setBackgroundInert(activeModal) {
  refreshInert(activeModal);
}

function trapFocus(event) {
  if (event.key !== 'Tab' || !(state.activeModal instanceof HTMLElement) || state.activeModal.getAttribute('aria-hidden') === 'true') return;
  const elements = focusable(state.activeModal);
  if (!elements.length) { event.preventDefault(); focusSafely(state.activeModal); return; }
  const first = elements[0];
  const last = elements[elements.length - 1];
  if (!state.activeModal.contains(document.activeElement)) {
    event.preventDefault(); focusSafely(event.shiftKey ? last : first); return;
  }
  if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
    event.preventDefault(); focusSafely(event.shiftKey ? last : first);
  }
}

export function initializeAccessibilityHelpers() {
  if (state.initialized || !document.body) return;
  document.addEventListener('keydown', trapFocus, true);
  state.initialized = true;
}

export function setAccessibleModalVisible(modal, isVisible, options = {}) {
  if (!(modal instanceof HTMLElement)) return false;
  initializeAccessibilityHelpers();
  if (isVisible) {
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (active && !modal.contains(active)) state.openers.set(modal, active);
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', options.ariaModal === false ? 'false' : 'true');
    modal.setAttribute('aria-hidden', 'false');
    if (options.labelledBy) modal.setAttribute('aria-labelledby', options.labelledBy);
    modal.classList.remove('hidden');
    modal.style.display = options.display || 'block';
    state.activeModal = modal;
    refreshInert(modal);
    window.requestAnimationFrame(() => { if (state.activeModal === modal) focusInitial(modal, options.initialFocus); });
    return true;
  }

  modal.classList.add('hidden');
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  if (state.activeModal === modal) state.activeModal = openModals().at(-1) || null;
  refreshInert(state.activeModal);
  const opener = state.openers.get(modal);
  if (options.restoreFocus !== false && opener instanceof HTMLElement && opener.isConnected && visible(opener)) {
    window.requestAnimationFrame(() => focusSafely(opener));
  }
  state.openers.delete(modal);
  return true;
}

export function waitForNativeMenuTrackingToSettle() {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      if (typeof window.requestAnimationFrame !== 'function') return resolve();
      window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
    }, 250);
  });
}

export async function waitForNativeSelectChangeToSettle(selectElement, expectedValue) {
  await waitForNativeMenuTrackingToSettle();
  if (!selectElement || !selectElement.isConnected) return false;
  return typeof expectedValue === 'undefined' || String(selectElement.value || '') === String(expectedValue || '');
}

export function announceSignboardStatus(message) {
  let region = document.getElementById('signboardStatusRegion');
  if (!region) {
    region = document.createElement('div');
    region.id = 'signboardStatusRegion';
    region.className = 'sr-only';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    document.body.append(region);
  }
  region.textContent = String(message || '');
}
