import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { vTooltip } from 'floating-vue'

import Button from '../Button.vue'
import Dropdown from '../Dropdown.vue'
import Modal from '../Modal.vue'
import MuuriGrid from '../MuuriGrid.vue'
import Tooltip from '../Tooltip.vue'

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverStub)

beforeEach(() => {
  document.body.innerHTML = '<div id="modals"></div><div id="dropdowns"></div><div id="dropdowns-within-modals"></div><div id="overlays"></div>'
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('shared Vue components', () => {
  it('loads the tooltip directive through Floating Vue', () => {
    const wrapper = mount(Tooltip, {
      props: { content: 'Details' },
      global: { directives: { tooltip: vTooltip } },
      slots: { default: '<button type="button">Help</button>' },
    })

    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.find('[data-v-popper-placement]').exists()).toBe(false)
  })

  it('loads the button and dropdown primitives', () => {
    const button = mount(Button, { slots: { default: 'Save' } })
    const dropdown = mount(Dropdown, {
      slots: {
        trigger: '<span>Menu</span>',
        content: '<button type="button">Item</button>',
      },
    })

    expect(button.find('button').text()).toContain('Save')
    expect(dropdown.find('.dropdown-trigger').exists()).toBe(true)
  })

  it('loads modal and Muuri grid primitives', async () => {
    const modal = mount(Modal, {
      props: { isOpen: true, onClose: vi.fn() },
    })
    const grid = mount(MuuriGrid, {
      props: { items: [{ id: 'one' }], dragEnabled: false, onSort: vi.fn() },
      slots: { default: '<div class="muuri-item" :data-id="item.id">Item</div>' },
    })

    await modal.vm.$nextTick()
    await grid.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(document.querySelector('#modals [role="dialog"]')).not.toBeNull()
    expect(grid.find('.grid').exists()).toBe(true)
  })
})
