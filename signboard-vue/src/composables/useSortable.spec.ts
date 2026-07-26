import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useSortable } from './useSortable'

describe('useSortable', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('allows small pointer movement before starting card drags', () => {
    const SortableMock = vi.fn(function (this: { destroy: () => void }) {
      this.destroy = vi.fn()
    })
    vi.stubGlobal('Sortable', SortableMock)

    const Harness = defineComponent({
      setup() {
        const target = ref<HTMLElement | null>(null)
        useSortable(target, { kind: 'cards', draggable: '.card', onEnd: vi.fn() })
        return () => h('div', { ref: target }, [h('div', { class: 'card' })])
      },
    })

    mount(Harness)

    expect(SortableMock).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ forceFallback: true, fallbackTolerance: 5 }),
    )
  })
})
