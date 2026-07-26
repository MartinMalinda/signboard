export const CUSTOM_SMART_CARD_ACTION_LIMIT: number
export const DEFAULT_SMART_CARD_ACTION_TARGET: string
export const DEFAULT_SMART_CARD_ACTIONS: readonly { id: string; type: string; target: string; label: string; prompt: string; builtIn: boolean; editable?: boolean }[]
export const SMART_CARD_ACTION_TARGETS: readonly string[]
export function normalizeAppSettings(value: unknown): AppSettings
export function normalizeNotificationSettings(value: unknown): { enabled: boolean; time: string }
export function normalizeOllamaUrl(value: unknown): string
export function normalizeSmartCardActionTarget(value: unknown, fallback?: string): string
export function normalizeSmartCardActions(value: unknown): SmartCardAction[]

import type { SmartCardAction } from '../src/types'
import type { AppSettings } from '../src/types'
