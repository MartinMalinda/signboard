export const NATIVE_MENU_SETTLE_DELAY_MS = 250

export function waitForNativeMenuTrackingToSettle() {
  return new Promise<void>((resolve) => {
    window.setTimeout(() => {
      if (typeof window.requestAnimationFrame !== 'function') return resolve()
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()))
    }, NATIVE_MENU_SETTLE_DELAY_MS)
  })
}

export async function waitForNativeSelectChangeToSettle(select: HTMLSelectElement, expectedValue?: string) {
  await waitForNativeMenuTrackingToSettle()
  if (!select?.isConnected) return false
  return expectedValue === undefined || String(select.value) === String(expectedValue)
}
