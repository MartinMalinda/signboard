export const MODAL_FOCUSABLE_SELECTOR: string
export function getModalFocusableElements(container: HTMLElement): HTMLElement[]
export function isElementActuallyVisible(element: HTMLElement): boolean
export function getOpenAccessibleModals(): HTMLElement[]
export function isTopAccessibleModal(modal: HTMLElement): boolean
export function focusSafely(element: HTMLElement | null): boolean
export function setBackgroundInert(activeModal: HTMLElement | null): void
export function announceSignboardStatus(message: string): void
