import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WorkspaceViewDock from '../components/WorkspaceViewDock.vue'

describe('workspace view dock', () => {
  it('shows Kanban and Table controls and switches the active accessible button', async () => {
    const onChange = vi.fn()
    const wrapper = mount(WorkspaceViewDock, { props: { activeView: 'table', onChange } })
    expect(wrapper.find('#workspaceViewTable').classes()).toContain('is-active')
    expect(wrapper.find('#workspaceViewTable').attributes('aria-current')).toBe('page')
    await wrapper.find('#workspaceViewKanban').trigger('click')
    expect(onChange).toHaveBeenCalledWith('kanban')
  })

  it('shows Dashboard only when the board profile enables it', async () => {
    const onChange = vi.fn()
    const wrapper = mount(WorkspaceViewDock, { props: { activeView: 'dashboard', dashboardEnabled: true, onChange } })
    expect(wrapper.find('#workspaceViewDashboard').exists()).toBe(true)
    expect(wrapper.find('#workspaceViewDashboard').attributes('aria-current')).toBe('page')
    await wrapper.find('#workspaceViewDashboard').trigger('click')
    expect(onChange).toHaveBeenCalledWith('dashboard')
  })
})
