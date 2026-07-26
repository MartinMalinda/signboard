export interface ShortcutEntry { mac: string; other: string; aria: string }
export const SHORTCUTS: Record<string, ShortcutEntry>
export function isMacPlatform(platform?: string): boolean
export function getShortcutHintText(id: string, platform?: string): string
export function getShortcutKeycapText(id: string, platform?: string): string
export function getShortcutAriaKeyshortcuts(id: string): string
