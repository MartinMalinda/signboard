const fs = require('fs').promises;
const path = require('path');
const {
  listOrderedEntries,
  removeFromOrderManifest,
  writeOrderManifest,
} = require('./orderManifest');

const cardPredicate = (entry) => entry.isFile() && entry.name.endsWith('.md');
const listPredicate = (entry) => entry.isDirectory() && entry.name !== 'XXX-Archive';

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function listCardFiles(listPath) {
  return listOrderedEntries(listPath, cardPredicate);
}

async function listListDirectories(boardRoot) {
  return listOrderedEntries(boardRoot, listPredicate);
}

async function getExistingOrderedSources(sourcePaths) {
  const sources = [];
  const seen = new Set();

  for (const sourcePath of Array.isArray(sourcePaths) ? sourcePaths : []) {
    const sourcePathText = String(sourcePath || '').trim();
    if (!sourcePathText) {
      continue;
    }

    const normalizedPath = path.resolve(sourcePathText);
    if (seen.has(normalizedPath) || !(await pathExists(normalizedPath))) {
      continue;
    }

    seen.add(normalizedPath);
    sources.push(normalizedPath);
  }

  return sources;
}

function assertNoDuplicateFinalNames(finalNames) {
  const seen = new Set();
  for (const finalName of finalNames) {
    if (seen.has(finalName)) {
      throw new Error(`ORDER_COLLISION:${finalName}`);
    }
    seen.add(finalName);
  }
}

async function removeMovedSourcesFromManifests(sourcePaths, targetDirectoryPath) {
  const sourceNamesByDirectory = new Map();
  const resolvedTargetDirectoryPath = path.resolve(targetDirectoryPath);

  for (const sourcePath of sourcePaths) {
    const sourceDirectoryPath = path.dirname(sourcePath);
    if (sourceDirectoryPath === resolvedTargetDirectoryPath) {
      continue;
    }

    const names = sourceNamesByDirectory.get(sourceDirectoryPath) || [];
    names.push(path.basename(sourcePath));
    sourceNamesByDirectory.set(sourceDirectoryPath, names);
  }

  for (const [sourceDirectoryPath, names] of sourceNamesByDirectory) {
    await removeFromOrderManifest(sourceDirectoryPath, names);
  }
}

async function reorderEntriesInDirectory({
  directoryPath,
  orderedSourcePaths,
  currentEntryNames,
}) {
  const resolvedDirectoryPath = path.resolve(directoryPath);
  const currentEntries = Array.isArray(currentEntryNames) ? currentEntryNames : [];
  const currentPaths = currentEntries.map((entryName) => path.join(resolvedDirectoryPath, entryName));
  const currentPathSet = new Set(currentPaths);
  const finalSources = await getExistingOrderedSources(orderedSourcePaths);
  const finalSourceSet = new Set(finalSources);

  for (const currentPath of currentPaths) {
    if (!finalSourceSet.has(currentPath)) {
      finalSources.push(currentPath);
      finalSourceSet.add(currentPath);
    }
  }

  const finalNames = finalSources.map((sourcePath, index) => applyCardPrefix(path.basename(sourcePath), index));
  assertNoDuplicateFinalNames(finalNames);

  const tempToken = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const stagedEntries = [];
  const stagedByPath = new Map();

  try {
    for (let index = 0; index < currentEntries.length; index += 1) {
      const originalEntryName = currentEntries[index];
      const originalPath = path.join(resolvedDirectoryPath, originalEntryName);
      const tempEntryName = `__sbtmp-${tempToken}-${String(index).padStart(3, '0')}.tmp`;
      const tempPath = path.join(resolvedDirectoryPath, tempEntryName);
      await fs.rename(originalPath, tempPath);
      stagedEntries.push({ originalEntryName, originalPath, tempEntryName, tempPath });
      stagedByPath.set(originalPath, { originalEntryName, originalPath, tempEntryName, tempPath });
    }

    for (let index = 0; index < finalSources.length; index += 1) {
      const sourcePath = finalSources[index];
      const stagedEntry = stagedByPath.get(sourcePath);
      const fromPath = stagedEntry ? stagedEntry.tempPath : sourcePath;
      const finalEntryName = finalNames[index];
      const finalPath = path.join(resolvedDirectoryPath, finalEntryName);
      await fs.rename(fromPath, finalPath);
    }
  } catch (error) {
    for (const stagedEntry of stagedEntries.slice().reverse()) {
      try {
        if (await pathExists(stagedEntry.tempPath) && !(await pathExists(stagedEntry.originalPath))) {
          await fs.rename(stagedEntry.tempPath, stagedEntry.originalPath);
        }
      } catch {
        // Preserve the original failure as the actionable error.
      }
    }
    throw error;
  }

  await writeOrderManifest(resolvedDirectoryPath, finalNames);
  await removeMovedSourcesFromManifests(finalSources, resolvedDirectoryPath);

  return finalSources.map((sourcePath, index) => ({
    originalSourcePath: sourcePath,
    finalEntryName: finalNames[index],
    finalPath: path.join(resolvedDirectoryPath, finalNames[index]),
    wasExistingEntry: currentPathSet.has(sourcePath),
  }));
}

function toNumberedPrefix(value) {
  return String(value).padStart(3, '0');
}

function applyCardPrefix(fileName, prefix) {
  const normalized = String(fileName || '').trim();
  const nextPrefix = toNumberedPrefix(prefix);

  if (/^\d+-/.test(normalized)) {
    return normalized.replace(/^\d+/, nextPrefix);
  }

  if (normalized.endsWith('.md')) {
    const baseName = normalized.slice(0, -3).replace(/^-+/, '');
    return `${nextPrefix}-${baseName}.md`;
  }

  return `${nextPrefix}-${normalized}`;
}

async function insertCardFileAtTop(listPath, sourcePath, sourceFileName) {
  const resolvedListPath = path.resolve(listPath);
  const resolvedSourcePath = path.resolve(sourcePath);
  const existingCardFiles = (await listCardFiles(resolvedListPath))
    .filter((fileName) => path.resolve(path.join(resolvedListPath, fileName)) !== resolvedSourcePath);
  const insertedFileName = applyCardPrefix(sourceFileName, 0);
  const insertedPath = path.join(resolvedListPath, insertedFileName);
  const sourceDirectoryPath = path.dirname(resolvedSourcePath);
  const sourceFileNameToRemove = path.basename(resolvedSourcePath);
  const tempToken = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const stagedCards = [];
  let moved = false;

  try {
    for (let index = 0; index < existingCardFiles.length; index += 1) {
      const originalFileName = existingCardFiles[index];
      const tempFileName = `__sbtmp-${tempToken}-${String(index).padStart(3, '0')}.tmp`;
      await fs.rename(
        path.join(resolvedListPath, originalFileName),
        path.join(resolvedListPath, tempFileName),
      );
      stagedCards.push({ originalFileName, tempFileName });
    }

    if (resolvedSourcePath !== insertedPath) {
      await fs.rename(resolvedSourcePath, insertedPath);
      moved = true;
    }

    for (let index = 0; index < stagedCards.length; index += 1) {
      const stagedCard = stagedCards[index];
      const finalFileName = applyCardPrefix(stagedCard.originalFileName, index + 1);
      await fs.rename(
        path.join(resolvedListPath, stagedCard.tempFileName),
        path.join(resolvedListPath, finalFileName),
      );
    }

    const reorderedNames = [insertedFileName, ...existingCardFiles.map((name, index) => applyCardPrefix(name, index + 1))];
    await writeOrderManifest(resolvedListPath, reorderedNames);
    if (sourceDirectoryPath !== resolvedListPath) {
      await removeFromOrderManifest(sourceDirectoryPath, [sourceFileNameToRemove]);
    }
  } catch (error) {
    if (moved && await pathExists(insertedPath) && !(await pathExists(resolvedSourcePath))) {
      try {
        await fs.rename(insertedPath, resolvedSourcePath);
      } catch {
        // Preserve the original failure as the actionable error.
      }
    }

    for (const stagedCard of stagedCards.slice().reverse()) {
      try {
        const stagedPath = path.join(resolvedListPath, stagedCard.tempFileName);
        const originalPath = path.join(resolvedListPath, stagedCard.originalFileName);
        if (await pathExists(stagedPath) && !(await pathExists(originalPath))) {
          await fs.rename(stagedPath, originalPath);
        }
      } catch {
        // Preserve the original failure as the actionable error.
      }
    }

    throw error;
  }

  return insertedFileName;
}

async function reorderCardFilesInList(listPath, orderedCardPaths) {
  const resolvedListPath = path.resolve(listPath);
  const currentCardFiles = await listCardFiles(resolvedListPath);
  const finalizedEntries = await reorderEntriesInDirectory({
    directoryPath: resolvedListPath,
    orderedSourcePaths: orderedCardPaths,
    currentEntryNames: currentCardFiles,
  });

  return finalizedEntries.map((entry) => ({
    sourcePath: entry.originalSourcePath,
    cardFile: entry.finalEntryName,
    cardPath: entry.finalPath,
    wasExistingCard: entry.wasExistingEntry,
  }));
}

async function reorderListDirectories(boardRoot, orderedListPaths) {
  const resolvedBoardRoot = path.resolve(boardRoot);
  const currentListDirectories = await listListDirectories(resolvedBoardRoot);
  const finalizedEntries = await reorderEntriesInDirectory({
    directoryPath: resolvedBoardRoot,
    orderedSourcePaths: orderedListPaths,
    currentEntryNames: currentListDirectories,
  });

  return finalizedEntries.map((entry) => ({
    sourcePath: entry.originalSourcePath,
    listDirectoryName: entry.finalEntryName,
    listPath: entry.finalPath,
    wasExistingList: entry.wasExistingEntry,
  }));
}

module.exports = {
  insertCardFileAtTop,
  reorderCardFilesInList,
  reorderListDirectories,
};
