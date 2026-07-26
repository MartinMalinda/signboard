export function getFrontmatterLinkedObjectCount(frontmatter?: Record<string, unknown>): number
export function getLinkedObjectCountLabel(count: number): string
export function addLinkedObject(existing: unknown[], next: unknown): Record<string, unknown>[]
export function linkedObjectKey(value: unknown): string
export function normalizeLinkedObject(value: unknown): Record<string, unknown> | null
export function normalizeCardLinkedObjects(frontmatter?: Record<string, unknown>): Record<string, unknown>[]
export function parseRelatedObsidianNote(value: string): { raw: string; target: string; title: string } | null
export function removeLinkedObject(frontmatter: unknown, target: unknown): Record<string, unknown>
