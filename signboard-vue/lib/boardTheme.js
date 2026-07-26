const PALETTE_VARIABLES = Object.freeze({
  boardBackground: 'bg',
  surface: 'bg-card',
  text: 'text',
  muted: 'muted',
  border: 'border',
  accent: 'accent',
  accentText: 'accent-contrast',
  shadow: 'shadow',
  shadowCard: 'shadow-card',
})

export const COLOR_SCHEMES = Object.freeze([
  {
    id: 'default', name: 'Default',
    light: { boardBackground: '#f7f8fa', surface: '#ffffff', text: '#0f172a', muted: '#6b7280', border: '#e6e8ec', accent: '#0b5fff', accentText: '#ffffff', shadow: 'rgba(15, 23, 42, .04)', shadowCard: 'rgba(15, 23, 42, .06)' },
    dark: { boardBackground: '#091102', surface: '#12200a', text: '#e8f0e5', muted: '#a0b3a3', border: '#1f2e17', accent: '#6fcf97', accentText: '#07130c', shadow: 'rgba(0, 0, 0, 0.45)', shadowCard: 'rgba(0, 0, 0, 0.55)' },
  },
  {
    id: 'lavender', name: 'Lavender',
    light: { boardBackground: '#f2f5ec', surface: '#fafbf7', text: '#2b2833', muted: '#706878', border: '#dddbd3', accent: '#7b6e8a', accentText: '#ffffff', shadow: 'rgba(43, 40, 51, 0.05)', shadowCard: 'rgba(43, 40, 51, 0.08)' },
    dark: { boardBackground: '#1e1b24', surface: '#292631', text: '#e6eed5', muted: '#a29dae', border: '#3a3644', accent: '#c4bdd2', accentText: '#1e1b24', shadow: 'rgba(0, 0, 0, 0.40)', shadowCard: 'rgba(0, 0, 0, 0.50)' },
  },
  {
    id: 'harvest', name: 'Harvest',
    light: { boardBackground: '#f6f2e8', surface: '#fcfaf4', text: '#33280f', muted: '#8a7b62', border: '#e5dece', accent: '#c4850a', accentText: '#ffffff', shadow: 'rgba(51, 40, 15, 0.05)', shadowCard: 'rgba(51, 40, 15, 0.08)' },
    dark: { boardBackground: '#1c1709', surface: '#282012', text: '#f0eacd', muted: '#b5a67f', border: '#3b3220', accent: '#f9a03f', accentText: '#1c1709', shadow: 'rgba(0, 0, 0, 0.40)', shadowCard: 'rgba(0, 0, 0, 0.50)' },
  },
  {
    id: 'olive', name: 'Olive',
    light: { boardBackground: '#faf6dc', surface: '#fefcee', text: '#283618', muted: '#6b6543', border: '#e4ddb8', accent: '#5d6832', accentText: '#fefae0', shadow: 'rgba(40, 54, 24, 0.06)', shadowCard: 'rgba(40, 54, 24, 0.09)' },
    dark: { boardBackground: '#161e0c', surface: '#212a14', text: '#f3efd2', muted: '#a39e72', border: '#303a1f', accent: '#dda15e', accentText: '#161e0c', shadow: 'rgba(0, 0, 0, 0.45)', shadowCard: 'rgba(0, 0, 0, 0.55)' },
  },
  {
    id: 'evergreen', name: 'Evergreen',
    light: { boardBackground: '#e8e5dc', surface: '#f2f0ea', text: '#1e2f22', muted: '#5c6e5e', border: '#cbc7ba', accent: '#4e7550', accentText: '#ffffff', shadow: 'rgba(30, 47, 34, 0.06)', shadowCard: 'rgba(30, 47, 34, 0.09)' },
    dark: { boardBackground: '#1a2620', surface: '#243029', text: '#dad7cd', muted: '#8da18a', border: '#2f3e34', accent: '#a3b18a', accentText: '#1a2620', shadow: 'rgba(0, 0, 0, 0.45)', shadowCard: 'rgba(0, 0, 0, 0.55)' },
  },
  {
    id: 'rosewood', name: 'Rosewood',
    light: { boardBackground: '#f3ece6', surface: '#faf7f4', text: '#2e3435', muted: '#6d7879', border: '#ddd7cf', accent: '#b5707c', accentText: '#ffffff', shadow: 'rgba(46, 52, 53, 0.05)', shadowCard: 'rgba(46, 52, 53, 0.08)' },
    dark: { boardBackground: '#1e2526', surface: '#292f30', text: '#f0e4da', muted: '#97a69a', border: '#383f40', accent: '#edafb8', accentText: '#1e2526', shadow: 'rgba(0, 0, 0, 0.40)', shadowCard: 'rgba(0, 0, 0, 0.50)' },
  },
  {
    id: 'mid-winter', name: 'Mid-winter',
    light: { boardBackground: '#d9dcd6', surface: '#eef3f5', text: '#16425b', muted: '#2f6690', border: '#81c3d7', accent: '#3a7ca5', accentText: '#ffffff', shadow: 'rgba(22, 66, 91, 0.07)', shadowCard: 'rgba(22, 66, 91, 0.11)' },
    dark: { boardBackground: '#16425b', surface: '#235775', text: '#d9dcd6', muted: '#81c3d7', border: '#3a7ca5', accent: '#81c3d7', accentText: '#16425b', shadow: 'rgba(0, 0, 0, 0.42)', shadowCard: 'rgba(0, 0, 0, 0.54)' },
  },
  {
    id: 'cozy-blush', name: 'Cozy Blush',
    light: { boardBackground: '#ffe5d9', surface: '#d8e2dc', text: '#5e4b52', muted: '#9d8189', border: '#f4acb7', accent: '#f4acb7', accentText: '#4f3c43', shadow: 'rgba(94, 75, 82, 0.06)', shadowCard: 'rgba(94, 75, 82, 0.10)' },
    dark: { boardBackground: '#5e4b52', surface: '#7d666e', text: '#ffe5d9', muted: '#d8e2dc', border: '#f4acb7', accent: '#ffcad4', accentText: '#5e4b52', shadow: 'rgba(0, 0, 0, 0.42)', shadowCard: 'rgba(0, 0, 0, 0.54)' },
  },
  {
    id: 'coffee', name: 'Coffee',
    light: { boardBackground: '#f4f1eb', surface: '#ebe5db', text: '#2f2a24', muted: '#7b7165', border: '#d7d0c4', accent: '#b08a64', accentText: '#fffaf4', shadow: 'rgba(47, 42, 36, 0.05)', shadowCard: 'rgba(47, 42, 36, 0.09)' },
    dark: { boardBackground: '#211b17', surface: '#302823', text: '#f1e9dc', muted: '#b8aa96', border: '#4b4037', accent: '#d0ab82', accentText: '#211b17', shadow: 'rgba(0, 0, 0, 0.42)', shadowCard: 'rgba(0, 0, 0, 0.56)' },
  },
])

const ACTIVE_MODE_VARIABLES = Object.freeze({
  boardBackground: '--bg',
  surface: '--bg-card',
  text: '--text',
  muted: '--muted',
  border: '--border',
  accent: '--accent',
  accentText: '--accent-contrast',
  shadow: '--shadow',
  shadowCard: '--shadow-card',
})

function normalizedMode(value) {
  return value === 'dark' ? 'dark' : 'light'
}

export function getColorSchemeById(id) {
  return COLOR_SCHEMES.find((scheme) => scheme.id === String(id || '').trim()) || COLOR_SCHEMES[0]
}

export function applyBoardThemeToElement(element, settings, themeMode = 'light') {
  if (!element) return null
  const scheme = getColorSchemeById(settings?.colorScheme)
  const mode = normalizedMode(themeMode)
  const activePalette = scheme[mode]

  element.dataset.boardColorScheme = scheme.id
  for (const paletteMode of ['light', 'dark']) {
    const palette = scheme[paletteMode]
    for (const [key, value] of Object.entries(palette)) {
      const variable = PALETTE_VARIABLES[key]
      if (variable) element.style.setProperty(`--sb-${paletteMode}-${variable}`, value)
    }
  }
  for (const [key, variable] of Object.entries(ACTIVE_MODE_VARIABLES)) {
    const value = activePalette[key]
    if (value) element.style.setProperty(variable, value)
  }
  element.style.setProperty('--due-date-today-color', mode === 'dark' ? 'color-mix(in oklab, #ff6b6b 80%, var(--text))' : 'color-mix(in oklab, #d92d20 72%, var(--text))')
  element.style.setProperty('--due-date-tomorrow-color', mode === 'dark' ? 'color-mix(in oklab, #4ade80 80%, var(--text))' : 'color-mix(in oklab, #15803d 78%, var(--text))')
  element.style.setProperty('--task-progress-complete-color', mode === 'dark' ? 'color-mix(in oklab, #4ade80 84%, var(--text))' : 'color-mix(in oklab, #15803d 78%, var(--text))')
  return scheme
}

export function clearBoardThemeFromElement(element) {
  if (!element) return
  delete element.dataset.boardColorScheme
  const names = new Set(Object.values(ACTIVE_MODE_VARIABLES))
  for (const mode of ['light', 'dark']) for (const variable of Object.values(PALETTE_VARIABLES)) names.add(`--sb-${mode}-${variable}`)
  names.add('--due-date-today-color'); names.add('--due-date-tomorrow-color'); names.add('--task-progress-complete-color')
  for (const name of names) element.style.removeProperty(name)
}
