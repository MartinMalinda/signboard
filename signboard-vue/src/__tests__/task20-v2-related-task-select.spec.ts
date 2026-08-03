import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import V2RelatedTaskSelect from '../components/editor/V2RelatedTaskSelect.vue'

describe('V2RelatedTaskSelect', () => {
  it('searches, adds, and removes multiple related tasks', async () => {
    const wrapper = mount(V2RelatedTaskSelect, {
      props: {
        label: 'Depends on',
        modelValue: ['Alpha task'],
        options: [
          { value: 'Alpha task', label: 'Alpha task', context: 'Ready' },
          { value: 'Beta task', label: 'Beta task', context: 'Doing' },
          { value: 'Gamma task', label: 'Gamma task', context: 'Done' },
        ],
      },
    })

    expect(wrapper.findAll('.v2-related-task-chip')).toHaveLength(1)
    const input = wrapper.find<HTMLInputElement>('.v2-related-task-input')
    await input.setValue('beta')
    expect(wrapper.findAll('.v2-related-task-option')).toHaveLength(1)
    expect(wrapper.find('.v2-related-task-option').text()).toContain('Beta task')
    await wrapper.find('.v2-related-task-option').trigger('click')
    const afterAdd = wrapper.emitted('update:modelValue') || []
    expect(afterAdd[afterAdd.length - 1]?.[0]).toEqual(['Alpha task', 'Beta task'])

    await wrapper.setProps({ modelValue: ['Alpha task', 'Beta task'] })
    await wrapper.find('[aria-label="Remove Alpha task"]').trigger('click')
    const afterRemove = wrapper.emitted('update:modelValue') || []
    expect(afterRemove[afterRemove.length - 1]?.[0]).toEqual(['Beta task'])
  })
})
