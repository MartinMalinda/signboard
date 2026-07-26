export interface RawUrlMatch { text: string; url: string; start: number; end: number }
export function trimUrlCandidate(value: string): string
export function normalizeRawUrl(value: string): string
export function findRawUrls(source: string): RawUrlMatch[]
export function markRawUrls(text: string): Array<{ type: string; value: string; url?: string; start?: number; end?: number }>
