export const TABLE_COLUMNS: readonly { id: string; label: string }[]
export const TABLE_SORT_OPTIONS: readonly { value: string; label: string }[]
export const TABLE_LIST_FILTERS: { readonly all: 'all'; readonly completed: 'completed'; readonly prefix: 'list:' }
export function normalizeTableTitle(value: unknown): string
export function getTableDisplayDate(entry: unknown, field: 'start' | 'due'): { dates: string[]; prefix: string }
export function createTableEntries(lists: unknown[], isCompletedList?: (listName: string) => boolean): any[]
export function filterTableEntries(entries: unknown[], options?: Record<string, unknown>): any[]
export function sortTableEntries(entries: unknown[], sortKey?: string): any[]
export function selectedTableEntries(entries: unknown[], selectedPaths: Set<string> | string[]): any[]
export function pruneTableSelection(selectedPaths: Set<string> | string[], lastSelectedPath: string, visibleEntries: unknown[]): { selectedPaths: Set<string>; lastSelectedPath: string }
export function selectVisibleTableEntries(visibleEntries: unknown[], selected: Set<string> | string[], shouldSelect: boolean): { selectedPaths: Set<string>; lastSelectedPath: string }
export function selectTableEntryRange(entry: unknown, visibleEntries: unknown[], selected: Set<string> | string[], lastSelectedPath: string, shouldSelect: boolean, useRange: boolean): { selectedPaths: Set<string>; lastSelectedPath: string }
export function createCardTimestampCellValue(value: unknown): string
export function formatCardTimestampDateTime(value: unknown): string
