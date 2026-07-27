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
  return listOrderedEntries(listPath, cardPredicate, { writeManifest: true });
}

async function listListDirectories(boardRoot) {
  return listOrderedEntries(boardRoot, listPredicate, { writeManifest: true });
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

function appendUnlistedSources(finalSources, currentPaths) {
  const result = [...finalSources];
  const seen = new Set(result);

  for (const currentPath of currentPaths) {
    if (!seen.has(currentPath)) {
      result.push(currentPath);
      seen.add(currentPath);
    }
  }

  return result;
}

function assertNoDuplicateNames(sourcePaths) {
  const seen = new Set();
  for (const sourcePath of sourcePaths) {
    const fileName = path.basename(sourcePath);
    if (seen.has(fileName)) {
      throw new Error(`ORDER_COLLISION:${fileName}`);
    }
    seen.add(fileName);
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

async function moveSourcesIntoDirectory(sourcePaths, targetDirectoryPath) {
  const resolvedTargetDirectoryPath = path.resolve(targetDirectoryPath);
  const movedSources = [];

  try {
    for (const sourcePath of sourcePaths) {
      const resolvedSourcePath = path.resolve(sourcePath);
      if (path.dirname(resolvedSourcePath) === resolvedTargetDirectoryPath) {
        continue;
      }

      const targetPath = path.join(resolvedTargetDirectoryPath, path.basename(resolvedSourcePath));
      if (await pathExists(targetPath)) {
        throw new Error(`CARD_NAME_COLLISION:${path.basename(targetPath)}`);
      }

      await fs.rename(resolvedSourcePath, targetPath);
      movedSources.push({ sourcePath: resolvedSourcePath, targetPath });
    }
  } catch (error) {
    for (const moved of movedSources.slice().reverse()) {
      try {
        if (await pathExists(moved.targetPath) && !(await pathExists(moved.sourcePath))) {
          await fs.rename(moved.targetPath, moved.sourcePath);
        }
      } catch {
        // Preserve the original failure as the actionable error.
      }
    }
    throw error;
  }

  return movedSources;
}

async function reorderCardFilesInList(listPath, orderedCardPaths) {
  const resolvedListPath = path.resolve(listPath);
  const currentCardFiles = await listCardFiles(resolvedListPath);
  const currentPaths = currentCardFiles.map((fileName) => path.join(resolvedListPath, fileName));
  const finalSources = appendUnlistedSources(
    await getExistingOrderedSources(orderedCardPaths),
    currentPaths,
  );

  assertNoDuplicateNames(finalSources);
  const movedSources = await moveSourcesIntoDirectory(finalSources, resolvedListPath);
  const finalNames = finalSources.map((sourcePath) => path.basename(sourcePath));

  try {
    await writeOrderManifest(resolvedListPath, finalNames);
    await removeMovedSourcesFromManifests(finalSources, resolvedListPath);
  } catch (error) {
    for (const moved of movedSources.slice().reverse()) {
      try {
        if (await pathExists(moved.targetPath) && !(await pathExists(moved.sourcePath))) {
          await fs.rename(moved.targetPath, moved.sourcePath);
        }
      } catch {
        // Preserve the original failure as the actionable error.
      }
    }
    throw error;
  }

  const currentPathSet = new Set(currentPaths);
  return finalSources.map((sourcePath, index) => ({
    sourcePath,
    cardFile: finalNames[index],
    cardPath: path.join(resolvedListPath, finalNames[index]),
    wasExistingCard: currentPathSet.has(sourcePath),
  }));
}

async function insertCardFileAtTop(listPath, sourcePath, sourceFileName) {
  const resolvedListPath = path.resolve(listPath);
  const resolvedSourcePath = path.resolve(sourcePath);
  const sourceName = path.basename(String(sourceFileName || resolvedSourcePath));
  const existingCardFiles = (await listCardFiles(resolvedListPath))
    .filter((fileName) => path.join(resolvedListPath, fileName) !== resolvedSourcePath);
  const result = await reorderCardFilesInList(resolvedListPath, [resolvedSourcePath, ...existingCardFiles.map((fileName) => path.join(resolvedListPath, fileName))]);

  const inserted = result.find((entry) => path.resolve(entry.sourcePath) === resolvedSourcePath);
  return inserted ? inserted.cardFile : sourceName;
}

async function reorderListDirectories(boardRoot, orderedListPaths) {
  const resolvedBoardRoot = path.resolve(boardRoot);
  const currentListDirectories = await listListDirectories(resolvedBoardRoot);
  const currentPaths = currentListDirectories.map((directoryName) => path.join(resolvedBoardRoot, directoryName));
  const finalSources = appendUnlistedSources(
    await getExistingOrderedSources(orderedListPaths),
    currentPaths,
  );

  assertNoDuplicateNames(finalSources);
  const finalNames = finalSources.map((sourcePath) => path.basename(sourcePath));
  await writeOrderManifest(resolvedBoardRoot, finalNames);

  const currentPathSet = new Set(currentPaths);
  return finalSources.map((sourcePath, index) => ({
    sourcePath,
    listDirectoryName: finalNames[index],
    listPath: path.join(resolvedBoardRoot, finalNames[index]),
    wasExistingList: currentPathSet.has(sourcePath),
  }));
}

module.exports = {
  insertCardFileAtTop,
  reorderCardFilesInList,
  reorderListDirectories,
};
