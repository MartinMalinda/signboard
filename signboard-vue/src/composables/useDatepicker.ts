/** Thin lifecycle wrapper around the vendored FDatepicker global. */
export function useDatepicker() {
  let anchor: HTMLInputElement | null = null
  let picker: { destroy?: () => void; update?: (options: Record<string, unknown>) => void; open?: () => void; setPosition?: () => void } | null = null

  function close() {
    picker?.destroy?.()
    anchor?.remove()
    picker = null
    anchor = null
  }

  function open(trigger: HTMLElement, value: string, onSelect: (value: string) => void) {
    close()
    if (!window.FDatepicker) return false
    anchor = document.createElement('input')
    anchor.type = 'text'
    anchor.value = value || ''
    anchor.setAttribute('aria-hidden', 'true')
    anchor.style.position = 'fixed'
    anchor.style.opacity = '0'
    anchor.style.pointerEvents = 'none'
    document.body.append(anchor)
    const rect = trigger.getBoundingClientRect()
    anchor.style.left = `${rect.left}px`
    anchor.style.top = `${rect.bottom}px`
    const nextPicker = new window.FDatepicker(anchor, { format: 'Y-m-d', autoClose: true }) as typeof picker
    picker = nextPicker
    nextPicker?.update?.({
      format: 'Y-m-d', autoClose: true,
      onSelect: (next: string) => onSelect(String(next || '')),
      onClose: close,
    })
    nextPicker?.open?.()
    nextPicker?.setPosition?.()
    return true
  }

  return { open, close }
}
