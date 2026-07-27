import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WorkspaceViewDock from '../components/WorkspaceViewDock.vue'

describe('workspace view dock', () => {
  it('shows Kanban and Table controls and switches the active accessible button', async () => {
    const onChange = vi.fn()
    const wrapper = mount(WorkspaceViewDock, { props: { activeView: 'table', onChange } })
    expect(wrapper.find('#workspaceViewPlanner').exists()).toBe(false)
    expect(wrapper.find('#workspaceViewTable').classes()).toContain('is-active')
    expect(wrapper.find('#workspaceViewTable').attributes('aria-current')).toBe('page')
    await wrapper.find('#workspaceViewKanban').trigger('click')
    expect(onChange).toHaveBeenCalledWith('kanban')
  })
})
