import type { SmartCardActionResult } from '../src/types'
export function normalizePreview(result?: SmartCardActionResult, action?: Record<string, unknown>): SmartCardActionResult & { readOnly: boolean; tasks: string[]; labels: string[]; attachments: Array<Record<string, unknown>>; title: string; body: string; due: string; answer: string; actionTarget: string; actionType: string; label: string }
export function applySmartActionPreview(state: Record<string, unknown>, result: SmartCardActionResult, options?: Record<string, unknown>): Record<string, unknown>
export function appendMarkdown(current: string, addition: string): string
export function contentForPreview(preview: Record<string, unknown>): string
export function normalizeTasks(tasks: unknown[]): string[]
export function normalizeAttachments(attachments: unknown[]): Array<Record<string, unknown>>
