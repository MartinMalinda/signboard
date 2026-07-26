export interface DueNotificationItem { kind: 'card' | 'task'; cardTitle: string; taskText?: string; boardName?: string }
export function normalizeDueNotificationText(value: unknown, maxLength: number): string
export function formatDueNotificationItemSummary(value: unknown): string
export function buildDueNotificationBody(values: DueNotificationItem[]): string
export function normalizeDueNotificationTime(value: unknown): string
export function hasReachedDueNotificationTime(now: Date, value: unknown): boolean
export function formatLocalIsoDate(value?: Date | string): string
export function collectDueTodayItemsForBoard(boardApi: unknown, boardRoot: string, todayIsoDate: string): Promise<DueNotificationItem[]>
