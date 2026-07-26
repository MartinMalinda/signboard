export const PLANNER_VIEW_IDS: { readonly calendar: 'calendar'; readonly thisWeek: 'this-week'; readonly day: 'day'; readonly agenda: 'agenda' }
export const PLANNER_DATE_FILTERS: { readonly none: ''; readonly today: 'today'; readonly overdue: 'overdue'; readonly next7: 'next:7'; readonly next14: 'next:14'; readonly next30: 'next:30' }
export const PLANNER_DATE_FILTER_OPTIONS: readonly { value: string; label: string }[]
export function normalizePlannerView(value: unknown): string
export function normalizePlannerDateFilter(value: unknown): string
export function parsePlannerIsoDate(value: unknown): Date | null
export function formatPlannerIsoDate(value: unknown): string
export function addPlannerDays(value: string, amount: number): string
export function createPlannerMonthCursor(value?: unknown): Date
export function createPlannerWeekCursor(value?: unknown): Date
export function createPlannerDayCursor(value?: unknown): Date
export function getPlannerTodayIso(now?: Date): string
export function plannerDateMatchesFilter(date: string, filter?: string, todayIso?: string): boolean
export function getPlannerTemporalDates(entry: unknown): string[]
export function plannerEntryMatches(entry: unknown, options?: Record<string, unknown>): boolean
export function createPlannerEntries(records: unknown[]): any[]
export function getPlannerVisibleDates(entry: unknown, options?: Record<string, unknown>): string[]
export function createPlannerPlacement(entry: unknown, date: string): any
export function buildPlannerBuckets(entries: unknown[], range: (date: string) => boolean, options?: Record<string, unknown>): Map<string, any[]>
export function buildPlannerAgenda(entries: unknown[], options?: Record<string, unknown>): any[]
export function comparePlannerPlacements(left: unknown, right: unknown): number
export interface PlannerSourcePalette { background: string; border: string; color: string; accent: string }
export function getPlannerSourceTheme(colorScheme?: string): { light: PlannerSourcePalette; dark: PlannerSourcePalette }
