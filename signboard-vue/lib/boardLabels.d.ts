export interface LabelDefinition { id: string; name: string; colorLight: string; colorDark: string }
export interface WorkflowSettings { autoDetectCompletedLists: boolean; completedListNames: string[]; ignoredCompletedListNames: string[] }
export const DEFAULT_LABELS: readonly LabelDefinition[]
export const DEFAULT_WORKFLOW_SETTINGS: Readonly<WorkflowSettings>
export function normalizeLabels(value: unknown): LabelDefinition[]
export function displayListName(value: string): string
export function normalizeWorkflowSettings(value: unknown): WorkflowSettings
export function isCompletedListByWorkflow(listName: string, settings: unknown): boolean
