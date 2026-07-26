import { onBeforeUnmount } from 'vue'

type DateSelect = (value: string) => void | Promise<void>

interface DatepickerInstance {
  open?: () => void
  close?: () => void
  setDate?: (date: Date) => void
  update?: (options: Record<string, unknown>) => void
  setPosition?: () => void
  destroy?: () => void
  popup?: HTMLElement
}

function parseDate(value: string) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

export function useDatepicker() {
  let anchor: HTMLInputElement | null = null
  let picker: DatepickerInstance | null = null

  function close() {
    picker?.destroy?.()
    anchor?.remove()
    anchor = null
    picker = null
  }

  async function open(trigger: HTMLElement, value: string, onSelect: DateSelect) {
    close()
    anchor = document.createElement('input')
    anchor.type = 'text'
    anchor.tabIndex = -1
    anchor.setAttribute('aria-hidden', 'true')
    anchor.dataset.fdatepicker = 'due-date-anchor'
    anchor.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1'
    const rect = trigger.getBoundingClientRect()
    anchor.style.left = `${Math.round(rect.left + window.scrollX)}px`
    anchor.style.top = `${Math.round(rect.bottom + window.scrollY)}px`
    document.body.append(anchor)

    const FDatepicker = window.FDatepicker
    if (typeof FDatepicker !== 'function') return
    picker = new FDatepicker(anchor, { format: 'Y-m-d', autoClose: true })
    const initial = parseDate(value)
    if (initial) picker.setDate?.(initial)
    picker.update?.({
      format: 'Y-m-d',
      autoClose: true,
      onSelect: (selected: string) => onSelect(String(selected || '').trim()),
      onClose: close,
    })
    picker.open?.()
    picker.setPosition?.()
  }

  onBeforeUnmount(close)
  return { open, close }
}
