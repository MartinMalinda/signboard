function normalizeCardFileName(filePath) {
  return String(filePath || '').replace(/\\/g, '/').split('/').pop() || '';
}

function deriveCardTitleFromFileName(filePath) {
  const fileName = normalizeCardFileName(filePath);
  const baseName = fileName.replace(/\.md$/i, '');
  const withoutOrderPrefix = baseName.replace(/^\d+\s*[-_]\s*/, '');
  const withoutGeneratedSuffix = withoutOrderPrefix.replace(/-(?:[A-Za-z0-9]{5}|stock)$/i, '');
  const words = withoutGeneratedSuffix
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!words) return 'Untitled';
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}

function getCardDisplayTitle(title, filePath) {
  const explicitTitle = String(title || '').replace(/^#\s*/, '').trim();
  return explicitTitle || deriveCardTitleFromFileName(filePath);
}

module.exports = {
  deriveCardTitleFromFileName,
  getCardDisplayTitle,
};
