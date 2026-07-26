export interface BoardThemePalette {
  boardBackground: string
  surface: string
  text: string
  muted: string
  border: string
  accent: string
  accentText: string
  shadow: string
  shadowCard: string
}

export interface BoardColorScheme {
  id: string
  name: string
  light: BoardThemePalette
  dark: BoardThemePalette
}

export const COLOR_SCHEMES: readonly BoardColorScheme[]
export function getColorSchemeById(id: unknown): BoardColorScheme
export function applyBoardThemeToElement(element: HTMLElement | null, settings: { colorScheme?: string } | null | undefined, themeMode?: 'light' | 'dark'): BoardColorScheme | null
export function clearBoardThemeFromElement(element: HTMLElement | null): void
