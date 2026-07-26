import type { ArchiveEntry } from '../src/types'

export const ARCHIVE_TABS: { readonly cards: 'cards'; readonly lists: 'lists' }
export function archiveDisplayNameForList(directoryName: string): string
export function sanitizeArchiveRestoreListName(value: string): string
export function buildArchiveRestoreListDirectoryName(originalDirectoryName: string, requestedDisplayName?: string): string
export function archiveEntrySearchText(entry: ArchiveEntry): string
export function sortArchiveEntries(entries: ArchiveEntry[], sortKey?: string, tab?: 'cards' | 'lists'): ArchiveEntry[]
export function filterArchiveEntries(entries: ArchiveEntry[], query?: string, sortKey?: string, tab?: 'cards' | 'lists'): ArchiveEntry[]
