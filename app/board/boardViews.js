const BOARD_VIEW_IDS = Object.freeze({
  KANBAN: 'kanban',
  TABLE: 'table',
});

const BOARD_VIEW_OPTIONS = Object.freeze([
  { id: BOARD_VIEW_IDS.KANBAN, label: 'Kanban', shortcutActionId: 'kanbanView' },
  { id: BOARD_VIEW_IDS.TABLE, label: 'Table', shortcutActionId: 'tableView' },
]);

const WORKSPACE_VIEW_IDS = Object.freeze({
  KANBAN: BOARD_VIEW_IDS.KANBAN,
  TABLE: BOARD_VIEW_IDS.TABLE,
});

const WORKSPACE_VIEW_ORDER = Object.freeze([
  WORKSPACE_VIEW_IDS.KANBAN,
  WORKSPACE_VIEW_IDS.TABLE,
]);

const WORKSPACE_VIEW_OPTIONS = Object.freeze([
  {
    id: WORKSPACE_VIEW_IDS.KANBAN,
    label: 'Kanban',
    shortcutActionId: 'kanbanView',
  },
  {
    id: WORKSPACE_VIEW_IDS.TABLE,
    label: 'Table',
    shortcutActionId: 'tableView',
  },
]);

function getBoardViewState() {
  if (!window.__boardViewState) {
    window.__boardViewState = {
      controlsInitialized: false,
      workspaceTransitionTimerId: 0,
      pendingWorkspaceTransitionDirection: '',
      viewByBoard: new Map(),
    };
  }

  return window.__boardViewState;
}

function normalizeBoardViewId(viewId) {
  const normalized = String(viewId || '').trim().toLowerCase();
  if (normalized === BOARD_VIEW_IDS.TABLE) {
    return BOARD_VIEW_IDS.TABLE;
  }

  return BOARD_VIEW_IDS.KANBAN;
}

function normalizeWorkspaceViewId(viewId) {
  const normalized = String(viewId || '').trim().toLowerCase();
  if (normalized === WORKSPACE_VIEW_IDS.TABLE) {
    return WORKSPACE_VIEW_IDS.TABLE;
  }

  return WORKSPACE_VIEW_IDS.KANBAN;
}

function getWorkspaceViewIndex(viewId) {
  const normalizedViewId = normalizeWorkspaceViewId(viewId);
  const index = WORKSPACE_VIEW_ORDER.indexOf(normalizedViewId);
  return index >= 0 ? index : WORKSPACE_VIEW_ORDER.indexOf(WORKSPACE_VIEW_IDS.KANBAN);
}

function getWorkspaceViewTransitionDirection(fromViewId, toViewId) {
  const fromIndex = getWorkspaceViewIndex(fromViewId);
  const toIndex = getWorkspaceViewIndex(toViewId);
  if (toIndex > fromIndex) {
    return 'right';
  }
  if (toIndex < fromIndex) {
    return 'left';
  }

  return '';
}

function normalizeWorkspaceTransitionDirection(direction) {
  const normalizedDirection = String(direction || '').trim().toLowerCase();
  return normalizedDirection === 'left' || normalizedDirection === 'right'
    ? normalizedDirection
    : '';
}

function shouldAnimateWorkspaceTransition() {
  return !(typeof prefersReducedMotion === 'function' && prefersReducedMotion());
}

function scheduleWorkspaceTransitionCallback(callback, delayMs = 0) {
  const scheduler = typeof window !== 'undefined' && window && typeof window.setTimeout === 'function'
    ? window.setTimeout.bind(window)
    : (typeof setTimeout === 'function' ? setTimeout : null);
  if (!scheduler) {
    callback();
    return 0;
  }
  return scheduler(callback, delayMs);
}

function clearWorkspaceTransitionCallback(timerId) {
  const clearer = typeof window !== 'undefined' && window && typeof window.clearTimeout === 'function'
    ? window.clearTimeout.bind(window)
    : (typeof clearTimeout === 'function' ? clearTimeout : null);
  if (clearer) {
    clearer(timerId);
  }
}

function getActiveWorkspaceView() {
  return getActiveBoardView();
}

function clearWorkspaceTransitionState() {
  const state = getBoardViewState();
  const body = document.body;
  if (state.workspaceTransitionTimerId) {
    clearWorkspaceTransitionCallback(state.workspaceTransitionTimerId);
    state.workspaceTransitionTimerId = 0;
  }
  state.pendingWorkspaceTransitionDirection = '';
  if (body) {
    body.removeAttribute('data-workspace-transition');
  }
}

function waitForWorkspaceTransitionFrame() {
  return new Promise((resolve) => {
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(resolve);
      });
      return;
    }

    scheduleWorkspaceTransitionCallback(resolve, 32);
  });
}

function waitForWorkspaceTransitionDelay(delayMs) {
  return new Promise((resolve) => {
    scheduleWorkspaceTransitionCallback(resolve, delayMs);
  });
}

function setWorkspaceTransitionAttribute(value) {
  const state = getBoardViewState();
  const body = document.body;
  if (!body) {
    return;
  }

  if (state.workspaceTransitionTimerId) {
    clearWorkspaceTransitionCallback(state.workspaceTransitionTimerId);
    state.workspaceTransitionTimerId = 0;
  }
  body.setAttribute('data-workspace-transition', value);
}

function setWorkspaceTransitionDirection(direction) {
  const normalizedDirection = normalizeWorkspaceTransitionDirection(direction);
  const state = getBoardViewState();
  if (!normalizedDirection || !shouldAnimateWorkspaceTransition()) {
    clearWorkspaceTransitionState();
    return;
  }

  state.pendingWorkspaceTransitionDirection = normalizedDirection;
}

function playPendingWorkspaceBoardTransition() {
  const state = getBoardViewState();
  const normalizedDirection = normalizeWorkspaceTransitionDirection(state.pendingWorkspaceTransitionDirection);
  state.pendingWorkspaceTransitionDirection = '';

  if (!normalizedDirection || !shouldAnimateWorkspaceTransition()) {
    clearWorkspaceTransitionState();
    return;
  }

  if (state.workspaceTransitionTimerId) {
    clearWorkspaceTransitionCallback(state.workspaceTransitionTimerId);
    state.workspaceTransitionTimerId = 0;
  }

  setWorkspaceTransitionAttribute(`enter-${normalizedDirection}`);
  state.workspaceTransitionTimerId = scheduleWorkspaceTransitionCallback(() => {
    if (document.body) {
      document.body.removeAttribute('data-workspace-transition');
    }
    state.workspaceTransitionTimerId = 0;
  }, 260);
}

async function prepareWorkspaceBoardTransition(direction) {
  const normalizedDirection = normalizeWorkspaceTransitionDirection(direction);
  if (!normalizedDirection || !shouldAnimateWorkspaceTransition()) {
    clearWorkspaceTransitionState();
    return;
  }

  const boardEl = document.getElementById('board');
  if (!boardEl || !window.boardRoot) {
    setWorkspaceTransitionDirection(normalizedDirection);
    return;
  }

  const exitDirection = normalizedDirection === 'right' ? 'left' : 'right';
  setWorkspaceTransitionAttribute(`exit-${exitDirection}`);
  await waitForWorkspaceTransitionFrame();
  await waitForWorkspaceTransitionDelay(120);
  setWorkspaceTransitionDirection(normalizedDirection);
}

function getActiveBoardKeyForViewState() {
  if (typeof normalizeBoardPath === 'function') {
    return normalizeBoardPath(window.boardRoot || '');
  }

  const fallbackPath = String(window.boardRoot || '').trim();
  if (!fallbackPath) {
    return '';
  }

  return fallbackPath.endsWith('/') ? fallbackPath : `${fallbackPath}/`;
}

function getActiveBoardView() {
  const state = getBoardViewState();
  const boardKey = getActiveBoardKeyForViewState();
  if (!boardKey) {
    return BOARD_VIEW_IDS.KANBAN;
  }

  if (!state.viewByBoard.has(boardKey)) {
    state.viewByBoard.set(boardKey, BOARD_VIEW_IDS.KANBAN);
  }

  return normalizeBoardViewId(state.viewByBoard.get(boardKey));
}

function setActiveBoardView(viewId, options = {}) {
  const normalizedView = normalizeBoardViewId(viewId);
  const boardKey = getActiveBoardKeyForViewState();
  const state = getBoardViewState();

  if (boardKey) {
    state.viewByBoard.set(boardKey, normalizedView);
  }

  syncBoardViewControlState();
  closeBoardViewPopover();
  if (typeof closeBoardMenuPopover === 'function') {
    closeBoardMenuPopover();
  }
  if (typeof announceSignboardStatus === 'function') {
    const activeOption = BOARD_VIEW_OPTIONS.find((option) => option.id === normalizedView);
    announceSignboardStatus(`Switched to ${activeOption ? activeOption.label : normalizedView} view.`);
  }

  if (options.render === false) {
    return;
  }

  renderBoard().catch((error) => {
    clearWorkspaceTransitionState();
    console.error('Failed to render board after changing view.', error);
  });
}

async function switchWorkspaceView(viewId, options = {}) {
  const targetView = normalizeWorkspaceViewId(viewId);
  const currentView = getActiveWorkspaceView();
  const direction = getWorkspaceViewTransitionDirection(currentView, targetView);

  if (typeof closeBoardSwitcher === 'function') {
    closeBoardSwitcher();
  }
  if (typeof closeBoardLabelFilterPopover === 'function') {
    closeBoardLabelFilterPopover();
  }
  if (typeof closeBoardMenuPopover === 'function') {
    closeBoardMenuPopover();
  }
  if (typeof closeBoardViewPopover === 'function') {
    closeBoardViewPopover();
  }

  await prepareWorkspaceBoardTransition(direction);
  setActiveBoardView(targetView);
  syncWorkspaceViewDockState(targetView);
  return true;
}

function syncBoardViewControlState() {
  syncWorkspaceViewDockState();
}

function getWorkspaceViewOption(viewId) {
  const normalizedViewId = normalizeWorkspaceViewId(viewId);
  return WORKSPACE_VIEW_OPTIONS.find((option) => option.id === normalizedViewId) || WORKSPACE_VIEW_OPTIONS[1];
}

function getWorkspaceViewButton(viewId) {
  const normalizedViewId = normalizeWorkspaceViewId(viewId);
  return document.querySelector(`.workspace-view-dock-button[data-workspace-view="${normalizedViewId}"]`);
}

function syncWorkspaceViewDockState(forcedActiveView = '') {
  const dock = document.getElementById('workspaceViewDock');
  if (!dock) {
    return;
  }

  const hasOpenBoard = Boolean(window.boardRoot);
  dock.setAttribute('aria-hidden', hasOpenBoard ? 'false' : 'true');

  const activeView = forcedActiveView
    ? normalizeWorkspaceViewId(forcedActiveView)
    : getActiveWorkspaceView();

  for (const option of WORKSPACE_VIEW_OPTIONS) {
    const button = getWorkspaceViewButton(option.id);
    if (!button) {
      continue;
    }

    const isActive = option.id === activeView;
    button.classList.toggle('is-active', isActive);
    button.classList.toggle('is-primary', option.id === WORKSPACE_VIEW_IDS.KANBAN);
    button.setAttribute('aria-pressed', String(isActive));
    button.setAttribute('aria-label', `${isActive ? 'Current view: ' : 'Show '}${option.label}`);
    button.setAttribute('title', `${option.label}${option.shortcutActionId ? ` (${getShortcutHintText(option.shortcutActionId)})` : ''}`);
    if (option.shortcutActionId) {
      button.setAttribute('aria-keyshortcuts', getShortcutAriaKeyshortcuts(option.shortcutActionId));
    } else {
      button.removeAttribute('aria-keyshortcuts');
    }
  }
}

function initializeWorkspaceViewDockControls() {
  const dock = document.getElementById('workspaceViewDock');
  if (!dock || dock.dataset.sbInitialized === 'true') {
    syncWorkspaceViewDockState();
    return;
  }

  for (const option of WORKSPACE_VIEW_OPTIONS) {
    const button = getWorkspaceViewButton(option.id);
    if (!button) {
      continue;
    }

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      switchWorkspaceView(option.id).catch((error) => {
        console.error('Failed to switch workspace view.', error);
      });
    });
  }

  dock.dataset.sbInitialized = 'true';
  syncWorkspaceViewDockState();
}

function closeBoardViewPopover() {
}

function closeBoardViewPopoverIfClickOutside(target) {
}

function initializeBoardViewControls() {
  const state = getBoardViewState();
  if (state.controlsInitialized) {
    initializeWorkspaceViewDockControls();
    syncBoardViewControlState();
    return;
  }

  initializeWorkspaceViewDockControls();

  syncBoardViewControlState();
  state.controlsInitialized = true;
}
