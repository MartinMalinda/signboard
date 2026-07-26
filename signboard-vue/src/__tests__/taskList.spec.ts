import { describe, expect, it } from 'vitest'
import { getTaskListSummary, parseTaskListItems } from '../../lib/taskList.js'

describe('Vue task-list copy', () => {
  it('keeps checklist counts and date markers aligned with legacy parsing', () => {
    const body = '- [ ] (start: 2026-03-18) (due: 2026-03-20) Prepare\n- [x] Done'
    expect(getTaskListSummary(body)).toEqual({ total: 2, completed: 1, remaining: 1 })
    expect(parseTaskListItems(body)[0]).toMatchObject({ start: '2026-03-18', due: '2026-03-20', contentWithoutDateMarkers: 'Prepare' })
  })
})
