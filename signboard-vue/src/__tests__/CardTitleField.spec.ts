import { defineComponent, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CardTitleField from '../components/editor/CardTitleField.vue'

describe('CardTitleField', () => {
  it('keeps typing at the caret when the parent updates on every input', async () => {
    const host = defineComponent({
      components: { CardTitleField },
      setup() {
        const value = ref('Hello')
        return { value, setTitle: (next: string) => { value.value = next } }
      },
      template: '<CardTitleField :value="value" :on-change="setTitle" />',
    })
    const wrapper = mount(host)
    const title = wrapper.find('#cardEditorTitle')

    expect(title.element.textContent).toBe('Hello')

    title.element.textContent = 'Hello '
    await title.trigger('input')
    await nextTick()
    title.element.textContent = 'Hello w'
    await title.trigger('input')
    await nextTick()
    title.element.textContent = 'Hello wo'
    await title.trigger('input')
    await nextTick()

    expect(title.element.textContent).toBe('Hello wo')
  })
})
