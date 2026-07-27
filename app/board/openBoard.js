async function pickAndOpenBoard() {
    const selection = await window.chooser.pickDirectory({ /* defaultPath: '/some/path' */ });
    if (!selection) {
        return false;
    }

    const selectedPath = getDirectorySelectionPath(selection);
    const boardPathInput = document.getElementById('boardPath');
    if (boardPathInput && selectedPath) {
        boardPathInput.value = selectedPath;
    }

    const authorizedBoardPath = await authorizeBoardAccess(selection);
    if (!authorizedBoardPath) {
        return false;
    }

    return openBoard(authorizedBoardPath);
}

function formatStarterCardDueDate(offsetDays) {
    const date = new Date();
    date.setDate(date.getDate() + Number(offsetDays || 0));

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function buildStarterCardContent() {
    const firstDueDate = formatStarterCardDueDate(1);
    const secondDueDate = formatStarterCardDueDate(2);
    const thirdDueDate = formatStarterCardDueDate(3);

    return `👋 Start Here

Welcome to Signboard.

This board lives in a folder on your computer. Lists are folders. Cards are Markdown files. That means your work stays portable, readable, and easy to automate.

## Try these first

- Edit this card title or body.
- Create a real card from the header Card button, a list actions menu, or Cmd/Ctrl + N.
- Drag a card between To do, Doing, and Done.
- Add a label or due date to this card.
- Search from the header, then press Enter to move into matching cards.
- Archive this card when you are done exploring.

## A tiny pretend plan

Here are a few example tasks so you can see how checklists and task due dates work:

- [ ] (due: ${firstDueDate}) Rename this board to something you actually care about
- [ ] (due: ${secondDueDate}) Add one real card you need to finish this week
- [ ] (due: ${thirdDueDate}) Open Planner and look for these dated checklist items
- [x] Opened Signboard and kicked the tires

## Things worth trying

- Use the bottom view dock to switch between Planner, Kanban, and Table.
- Open Planner Calendar or This Week to see dated work across open boards.
- Switch the bottom view dock to Table and scan cards across lists.
- Open the filter menu and try the label filters.
- Open Settings and customize labels, completed-list behavior, and board colors.
- Open Archive from the Board menu after archiving a card or list.

## Keyboard shortcuts

On macOS use Cmd. On Windows and Linux use Ctrl.

- Cmd/Ctrl + / opens the keyboard shortcuts helper
- Cmd/Ctrl + F focuses search; Enter or Arrow Down moves into matching cards
- Cmd/Ctrl + K switches between open boards
- Cmd/Ctrl + N opens Quick Add for any open board
- Cmd/Ctrl + Shift + N creates a new list
- Cmd/Ctrl + 1 returns to Kanban
- Cmd/Ctrl + Option/Alt + 1 opens Table
- Cmd/Ctrl + 2 opens Planner Calendar for all open boards
- Cmd/Ctrl + 3 opens Planner This Week for all open boards
- Cmd/Ctrl + Shift + P opens or closes Planner
- Cmd/Ctrl + , opens Settings
- Cmd/Ctrl + Shift + A opens Archive
- Esc closes open modals and popovers

## One last thing

Keep this card as a reference, or archive it and start fresh.`;
}

async function openBoard( dir ) {
    const boardPath = await authorizeBoardAccess(dir);
    if (!boardPath) {
        return false;
    }

    if (typeof closeBoardSettingsModal === 'function') {
        await closeBoardSettingsModal();
    }

    if (typeof closeArchiveBrowserModal === 'function') {
        closeArchiveBrowserModal();
    }

    if (typeof flushBoardLabelSettingsSave === 'function') {
        await flushBoardLabelSettingsSave();
    }

    ensureBoardInTabs(boardPath);

    if (typeof migrateAppSettingsFromOpenBoards === 'function') {
        await migrateAppSettingsFromOpenBoards();
    }

    const directories = await window.board.listDirectories( boardPath );

    if ( directories.length == 0 ) {
        await Promise.all([
            window.board.createList(boardPath + 'To-do'),
            window.board.createList(boardPath + 'Doing'),
            window.board.createList(boardPath + 'Done'),
            window.board.createList(boardPath + 'XXX-Archive'),
        ]);

        await window.board.createCard( boardPath + 'To-do/000-hello-stock.md', buildStarterCardContent() );
    }

    window.boardRoot = boardPath;
    setStoredActiveBoard(window.boardRoot);

    if (typeof resetBoardLabelFilter === 'function') {
        resetBoardLabelFilter();
    }

    if (typeof resetBoardSearch === 'function') {
        resetBoardSearch();
    }

    await renderBoard();
    return true;
}
