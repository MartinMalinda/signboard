export const DATE_FILTERS: { readonly none: ''; readonly today: 'today'; readonly overdue: 'overdue'; readonly next7: 'next:7'; readonly next14: 'next:14'; readonly next30: 'next:30' }
export const DATE_FILTER_LABELS: Record<string, string>
export function normalizeDateFilter(value: unknown): string
export function normalizeIsoDate(value: unknown): string
export function todayIso(now?: Date): string
export function actionableTaskDates(card: unknown): string[]
export function cardDates(card: unknown): string[]
export function matchesDateFilter(card: unknown, filter: string, options?: { isCompletedList?: boolean; today?: string }): boolean
export function matchesSearch(card: unknown, query: string): boolean
export function matchesLabels(card: unknown, selectedLabelIds: string[]): boolean
export function cardMatchesFilters(card: unknown, options?: Record<string, unknown>): boolean
export function getActiveFilterCount(options?: { dateFilter?: string; selectedLabelIds?: string[] }): number
