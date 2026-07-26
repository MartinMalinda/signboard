import { describe, expect, it } from 'vitest'
import { applyBoardThemeToElement, clearBoardThemeFromElement, COLOR_SCHEMES } from '../../lib/boardTheme.js'

describe('Task 14 board color schemes', () => {
  it('keeps the legacy scheme set and applies the active light palette to the board only', () => {
    expect(COLOR_SCHEMES.map((scheme) => scheme.id)).toEqual(['default', 'lavender', 'harvest', 'olive', 'evergreen', 'rosewood', 'mid-winter', 'cozy-blush', 'coffee'])

    const board = document.createElement('main')
    const planner = document.createElement('section')
    document.documentElement.style.removeProperty('--bg')
    document.body.append(board, planner)

    applyBoardThemeToElement(board, { colorScheme: 'harvest' }, 'light')

    expect(board.dataset.boardColorScheme).toBe('harvest')
    expect(board.style.getPropertyValue('--bg')).toBe('#f6f2e8')
    expect(board.style.getPropertyValue('--bg-card')).toBe('#fcfaf4')
    expect(board.style.getPropertyValue('--accent')).toBe('#c4850a')
    expect(board.style.getPropertyValue('--sb-dark-bg')).toBe('#1c1709')
    expect(document.documentElement.style.getPropertyValue('--bg')).toBe('')
    expect(planner.style.getPropertyValue('--bg')).toBe('')

    board.remove(); planner.remove()
  })

  it('switches the same board to the dark palette without changing the selected scheme', () => {
    const board = document.createElement('main')
    applyBoardThemeToElement(board, { colorScheme: 'cozy-blush' }, 'dark')

    expect(board.dataset.boardColorScheme).toBe('cozy-blush')
    expect(board.style.getPropertyValue('--bg')).toBe('#5e4b52')
    expect(board.style.getPropertyValue('--bg-card')).toBe('#7d666e')
    expect(board.style.getPropertyValue('--text')).toBe('#ffe5d9')
    expect(board.style.getPropertyValue('--accent-contrast')).toBe('#5e4b52')
  })

  it('clears scoped variables when the active board is removed', () => {
    const board = document.createElement('main')
    applyBoardThemeToElement(board, { colorScheme: 'coffee' }, 'light')
    clearBoardThemeFromElement(board)

    expect(board.dataset.boardColorScheme).toBeUndefined()
    expect(board.style.getPropertyValue('--bg')).toBe('')
    expect(board.style.getPropertyValue('--sb-light-bg')).toBe('')
    expect(board.style.getPropertyValue('--due-date-today-color')).toBe('')
  })
})
