export function normalizeRoot(value: string): string
export function listRoot(listPath: string): string
export function buildCardPath(listPath: string, cardName: string, cardCount: number): Promise<string>
export function buildListPath(boardRoot: string, listName: string, listCount: number): Promise<string>
export function insertAfter<T>(items: T[], item: T, after: T | undefined): T[]
