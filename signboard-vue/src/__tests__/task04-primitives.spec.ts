import { describe, expect, it } from 'vitest'
import { buildCardPath, buildListPath, insertAfter, listRoot } from '../../lib/cardCreation.js'
import { deriveCardTitleFromFileName, getCardDisplayTitle } from '../../lib/cardTitle.js'
import { getShortcutAriaKeyshortcuts, getShortcutHintText, isMacPlatform } from '../../lib/shortcutLabels.js'

describe('Task 04 creation and shortcut primitives', () => {
  it('builds portable card and list paths', async () => {
    const cardPath = await buildCardPath('/boards/demo/001-doing/', 'Fix the search box', 2)
    const listPath = await buildListPath('/boards/demo/', 'Doing', 3)
    expect(cardPath).toMatch(/^\/boards\/demo\/001-doing\/fix-the-search-box-[a-z0-9]{5}\.md$/i)
    expect(listPath).toBe('/boards/demo/Doing')
    expect(listRoot('/boards/demo/001-doing/')).toBe('/boards/demo/')
  })

  it('inserts a new list after the requested list without duplicating it', () => {
    expect(insertAfter(['/a', '/b'], '/new', '/a')).toEqual(['/a', '/new', '/b'])
    expect(insertAfter(['/a', '/b'], '/a', '/b')).toEqual(['/b', '/a'])
  })

  it('derives display titles from stable card filenames', () => {
    expect(deriveCardTitleFromFileName('003-fix-login-Ab12c.md')).toBe('Fix login')
    expect(deriveCardTitleFromFileName('000-hello-stock.md')).toBe('Hello')
    expect(getCardDisplayTitle('', '003-fix-login-Ab12c.md')).toBe('Fix login')
    expect(getCardDisplayTitle('Custom title', '003-fix-login-Ab12c.md')).toBe('Custom title')
  })

  it('keeps platform shortcut text and aria values aligned', () => {
    expect(isMacPlatform('MacIntel')).toBe(true)
    expect(getShortcutHintText('addCard', 'MacIntel')).toBe('⌘ N')
    expect(getShortcutHintText('addCard', 'Linux x86_64')).toBe('Ctrl N')
    expect(getShortcutAriaKeyshortcuts('addList')).toBe('Shift+Meta+N')
  })
})
