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

  it('shows an optional-title placeholder without storing it as text', async () => {
    const wrapper = mount(CardTitleField, { props: { value: '', placeholder: 'Fix login', onChange: () => {} } })
    const title = wrapper.find('#cardEditorTitle')

    expect(title.element.textContent).toBe('')
    expect(title.attributes('data-placeholder')).toBe('Fix login')
    expect(title.classes()).toContain('is-empty')
  })
})
