export interface BoardLabel {
  id: string
  name: string
  colorLight?: string
  colorDark?: string
}

export interface TaskSummary {
  total: number
  completed: number
  remaining: number
}

export interface CardSnapshot {
  cardName: string
  cardPath: string
  frontmatter: Record<string, unknown>
  body: string
  taskSummary: TaskSummary
  taskStartDates: string[]
  incompleteTaskStartDates: string[]
  taskDueDates: string[]
  incompleteTaskDueDates: string[]
  timestamps?: { createdAt?: string; updatedAt?: string }
  taskItems?: Array<Record<string, unknown>>
  v2?: V2CardProjection
}

export interface V2CardProjection {
  score_version: number
  normalized: Record<string, unknown>
  metadata: Record<string, unknown>
  scores: Record<string, number | null>
  eligibility: Record<string, unknown>
  classes: Record<string, string | null>
  sections: Array<Record<string, unknown>>
  missing_fields: string[]
  defaults_applied: Record<string, unknown>
  warnings: string[]
}

export interface CardRead {
  frontmatter: Record<string, unknown>
  body: string
  timestamps?: { createdAt?: string; updatedAt?: string; createdAtSource?: string; updatedAtSource?: string }
}

export interface BoardListSnapshot {
  listName: string
  listPath: string
  cards: CardSnapshot[]
}

export type V2StageKey = 'inbox' | 'shaping' | 'ready' | 'active' | 'review' | 'blocked' | 'done' | 'dropped'

export interface V2BoardProfile {
  enabled?: boolean
  profileId?: string
  version?: number
  title?: string
  description?: string
  stages?: Partial<Record<V2StageKey, string[]>> & Record<string, unknown>
  dashboard?: {
    sections?: string[]
    title?: string
    description?: string
    [key: string]: unknown
  }
  cardDisplay?: {
    showSignals?: boolean
    showDerivedBadges?: boolean
    density?: 'compact' | 'standard' | string
    [key: string]: unknown
  }
  cardDefaults?: {
    kind?: string
    workType?: string
    priorityClass?: string
    [key: string]: unknown
  }
  validationPolicy?: string
  retainPlanner?: boolean
  [key: string]: unknown
}

export interface BoardSettings {
  labels?: BoardLabel[]
  colorScheme?: string
  workflow?: { autoDetectCompletedLists?: boolean; completedListNames?: string[]; ignoredCompletedListNames?: string[] }
  v2?: V2BoardProfile
  [key: string]: unknown
}

export interface SmartCardAction {
  id: string
  type: string
  target: string
  label: string
  prompt: string
  builtIn: boolean
  editable?: boolean
}

export type LinkedObjectType = 'obsidian-note' | 'file' | 'folder' | 'url' | 'app-link' | 'signboard-link'

export interface LinkedObject {
  type: LinkedObjectType | string
  title?: string
  path?: string
  url?: string
  target?: string
  raw?: string
  faviconPath?: string
  token?: string
}

export interface SmartCardActionResult {
  ok?: boolean
  actionId?: string
  actionType?: string
  actionTarget?: string
  label?: string
  title?: string
  body?: string
  tasks?: string[]
  labels?: string[]
  due?: string
  attachments?: LinkedObject[]
  answer?: string
  message?: string
  error?: string
  debug?: unknown
}

export interface AppSettings {
  version: number
  notifications: { enabled: boolean; time: string }
  tooltipsEnabled: boolean
  quickAdd: { globalShortcut: string }
  externalPublishedCalendar: { enabled: boolean; port: number; token: string }
  ai: {
    enabled: boolean
    provider: string
    ollama: { url: string; model: string }
    smartCardActions: SmartCardAction[]
  }
  migration?: { boardSettingsMigrated: boolean; sourceBoardRoot: string; migratedAt: string }
}

export interface OllamaModel {
  name: string
  model: string
  modifiedAt?: string
  size?: number
  digest?: string
  details?: Record<string, unknown>
}

export interface OllamaStatus {
  checked: boolean
  checking: boolean
  ok: boolean
  url: string
  models: OllamaModel[]
  message: string
}

export interface ExternalCalendarStatus {
  enabled: boolean
  running: boolean
  port: number
  url: string
  message: string
}

export interface GlobalShortcutStatus {
  accelerator: string
  registered: boolean
  message: string
}

export interface ArchiveEntry {
  kind: 'card' | 'list'
  entryPath: string
  title?: string
  cardId?: string
  listDirectoryName?: string
  listDisplayName?: string
  originalListDirectoryName?: string
  originalListDisplayName?: string
  archivedAt?: string
  due?: string
  labels?: string[]
  labelNames?: string[]
  previewText?: string
  insideArchivedList?: boolean
  cardCount?: number
  [key: string]: unknown
}

export interface ArchiveDetail extends ArchiveEntry {
  card?: CardRead
  cards?: Array<{ title?: string; [key: string]: unknown }>
}

export interface BoardSnapshot {
  ok: boolean
  boardRoot: string
  boardName: string
  boardSettings: BoardSettings | null
  lists: BoardListSnapshot[]
  errors: Array<{ path: string; code: string; message: string }>
  v2?: BoardV2Snapshot
}

export interface BoardV2Snapshot {
  profile: V2BoardProfile
  cards: Array<V2CardProjection & { listName: string; cardName: string; cardPath: string }>
}

export interface DirectorySelection {
  path: string
  token?: string
}

export interface BoardBridge {
  authorizeBoardSelection(selectionToken: string): Promise<{ ok?: boolean; boardRoot?: string } | null>
  adoptLegacyBoardRoots?(boardRoots: string[]): Promise<unknown>
  setActiveBoardRoot(boardRoot: string): Promise<{ ok?: boolean; boardRoot?: string } | null>
  syncOpenBoardsState(state: { openBoardPaths: string[]; activeBoardPath: string }): Promise<unknown>
  clearActiveBoardRoot(): Promise<unknown>
  listDirectories(root: string): Promise<string[]>
  initializeNewBoard?(root: string): Promise<unknown>
  listLists?(root: string): Promise<string[]>
  listCards?(listPath: string): Promise<string[]>
  readBoardSnapshot(root: string, options?: Record<string, unknown>): Promise<BoardSnapshot>
  startBoardWatch?(root: string): Promise<{ ok?: boolean; [key: string]: unknown }>
  stopBoardWatch?(): Promise<unknown>
  readBoardSettings?(root: string): Promise<BoardSettings>
  updateBoardLabels?(root: string, labels: BoardLabel[]): Promise<unknown>
  updateBoardSettings?(root: string, settings: Record<string, unknown>): Promise<unknown>
  duplicateBoard?(root: string, options: { boardName: string; destinationParentToken: string }): Promise<{ ok?: boolean; boardRoot?: string }>
  generateObsidianBase?(root: string): Promise<Record<string, unknown>>
  openObsidianBase?(root: string): Promise<Record<string, unknown>>
  importTrello?(root: string, selectionToken: string): Promise<Record<string, unknown>>
  importObsidian?(root: string, selectionTokens: string[]): Promise<Record<string, unknown>>
  importTasksMd?(root: string, selectionTokens: string[]): Promise<Record<string, unknown>>
  createList(listPath: string): Promise<unknown>
  createCard(filePath: string, content: string, options?: { frontmatter?: Record<string, unknown> }): Promise<unknown>
  duplicateCard?(filePath: string): Promise<unknown>
  moveList(source: string, destination: string): Promise<unknown>
  moveCard(source: string, destination: string): Promise<unknown>
  getBoardName(filePath: string): string
  formatDueDate(dateString: string): Promise<string>
  countCards?(listPath: string): Promise<number>
  reorderCardsInList?(listPath: string, orderedCardPaths: string[]): Promise<unknown>
  reorderLists?(orderedListPaths: string[]): Promise<unknown>
  deleteList?(listPath: string): Promise<unknown>
  readCard(filePath: string): Promise<CardRead>
  listArchiveEntries?(): Promise<{ cards?: ArchiveEntry[]; lists?: ArchiveEntry[] }>
  readArchiveEntry?(entryPath: string): Promise<{ entry?: ArchiveDetail }>
  restoreArchivedCard?(archivedCardPath: string, targetListPath: string): Promise<unknown>
  restoreArchivedList?(archivedListPath: string, restoredDirectoryName: string): Promise<unknown>
  writeCard(filePath: string, card: { frontmatter: Record<string, unknown>; body: string }): Promise<unknown>
  updateFrontmatter(filePath: string, partialFrontmatter: Record<string, unknown>): Promise<Record<string, unknown>>
  normalizeFrontmatter(frontmatter: Record<string, unknown>): Promise<Record<string, unknown>>
  getCardID?(filePath: string): Promise<string>
  getCardFileName?(filePath: string): string
  listLists?(root: string): Promise<string[]>
  moveCardToTop?(cardPath: string, targetListPath: string): Promise<{ ok?: boolean; cardPath?: string }>
  archiveCard?(filePath: string): Promise<unknown>
  archiveList?(listPath: string): Promise<unknown>
  openCard?(filePath: string): Promise<unknown>
  openCardDefault?(filePath: string): Promise<unknown>
  openCardInObsidian?(filePath: string): Promise<unknown>
  getCardExternalLinks?(filePath: string): Promise<{ ok?: boolean; inObsidianVault?: boolean }>
  addLinkedObject?(filePath: string, linkedObject: LinkedObject): Promise<{ ok?: boolean; linkedObject?: LinkedObject; frontmatter?: Record<string, unknown>; error?: string }>
  openLinkedObject?(filePath: string, linkedObject: LinkedObject): Promise<{ ok?: boolean; error?: string; [key: string]: unknown }>
  getLinkedObjectStatus?(filePath: string, linkedObject: LinkedObject): Promise<{ ok?: boolean; missing?: boolean; status?: string; error?: string; [key: string]: unknown }>
  recreateLinkedObsidianNote?(boardRoot: string, filePath: string, linkedObject: LinkedObject): Promise<{ ok?: boolean; linkedObject?: LinkedObject; frontmatter?: Record<string, unknown>; error?: string }>
  relinkLinkedObsidianNote?(boardRoot: string, filePath: string, previousLinkedObject: LinkedObject, nextLinkedObject: LinkedObject): Promise<{ ok?: boolean; linkedObject?: LinkedObject; frontmatter?: Record<string, unknown>; error?: string }>
  createLinkedObsidianNote?(boardRoot: string, filePath: string): Promise<{ ok?: boolean; linkedObject?: LinkedObject; frontmatter?: Record<string, unknown>; error?: string; [key: string]: unknown }>
  copyCardObsidianUri?(filePath: string): Promise<unknown>
  copyCardSignboardUri?(filePath: string): Promise<unknown>
  getBoardWatchToken?(): Promise<number>
}

export interface ChooserBridge {
  pickDirectory(options?: { defaultPath?: string }): Promise<string | DirectorySelection | null>
  pickImportSources?(options?: { importer: string; defaultPath?: string }): Promise<DirectorySelection[] | null>
  pickLinkedObjects?(options?: { mode?: 'file' | 'folder' | 'url' | 'app-link'; defaultPath?: string }): Promise<DirectorySelection[] | null>
  linkDroppedObjects?(cardPath: string, files: FileList | File[] | unknown): Promise<{ ok?: boolean; linkedObjects?: LinkedObject[]; frontmatter?: Record<string, unknown>; error?: string }>
}

export interface ElectronApiBridge {
  getInitialBoardPath?(): Promise<string>
  onToggleThemeMode?(callback: () => void): () => void
  copyTextToClipboard?(text: string): Promise<unknown>
  onOpenQuickAddCard?(callback: () => void): () => void
  onOpenBoardSettings?(callback: () => void): () => void
  readAppSettings?(): Promise<AppSettings>
  updateAppSettings?(partialSettings: Record<string, unknown>): Promise<AppSettings>
  inspectOllama?(payload: { url: string }): Promise<{ ok?: boolean; message?: string; models?: OllamaModel[] }>
  suggestCardTasks?(payload: Record<string, unknown>): Promise<SmartCardActionResult>
  runSmartCardAction?(payload: Record<string, unknown>): Promise<SmartCardActionResult>
  notifyDueCards?(payload: { title: string; body: string }): Promise<{ ok?: boolean; error?: string }>
  getGlobalShortcutStatus?(): Promise<GlobalShortcutStatus>
  getAppInfo?(): Promise<{ appName?: string; appVersion?: string; authorName?: string; authorUrl?: string; copyright?: string; license?: string; websiteUrl?: string }>
  openExternal?(url: string): Promise<unknown>
  onOpenAboutSignboard?(callback: () => void): () => void
  onOpenKeyboardShortcuts?(callback: () => void): () => void
  onOpenBoardSwitcher?(callback: () => void): () => void
  onSwitchBoardView?(callback: (viewId: string) => void): () => void
}

export type ButtonVariant =
  | "magic"
  | "primary"
  | "secondary"
  | "text"
  | "plain"
  | "blur"
  | "highlight"
  | "danger";
export type ButtonSize = "small" | "smaller" | "medium" | "big" | "tiny";
