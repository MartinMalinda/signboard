export interface TaskSummary { total: number; completed: number; remaining: number }
export interface TaskListItem { start: string; due: string; startMarker?: string; contentWithoutDateMarkers: string; isCompleted: boolean; lineIndex: number; lineStart: number; line: string; [key: string]: unknown }
export function getTaskListSummary(body: string): TaskSummary
export function parseTaskListItems(body: string): TaskListItem[]
export function setTaskListItemDateByLineIndex(body: string, lineIndex: number, dateKind: 'start' | 'due', dateValue: string): string
