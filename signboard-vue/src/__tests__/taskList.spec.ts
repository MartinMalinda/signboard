import { describe, expect, it } from 'vitest'
import { getTaskListSummary, parseTaskListItems, setTaskListItemDateByLineIndex } from '../../lib/taskList.js'

describe('Vue task-list copy', () => {
  it('keeps checklist counts and date markers aligned with legacy parsing', () => {
    const body = '- [ ] (start: 2026-03-18) (due: 2026-03-20) Prepare\n- [x] Done'
    expect(getTaskListSummary(body)).toEqual({ total: 2, completed: 1, remaining: 1 })
    expect(parseTaskListItems(body)[0]).toMatchObject({ start: '2026-03-18', due: '2026-03-20', contentWithoutDateMarkers: 'Prepare' })
  })

  it('preserves scheduled markers when a task due date is edited', () => {
    const body = '- [ ] (scheduled: 2026-03-18) (due: 2026-03-20) Prepare'
    expect(setTaskListItemDateByLineIndex(body, 0, 'due', '2026-03-22')).toBe('- [ ] (scheduled: 2026-03-18) (due: 2026-03-22) Prepare')
    expect(parseTaskListItems(body)[0]).toMatchObject({ start: '2026-03-18', startMarker: 'scheduled' })
  })
})
