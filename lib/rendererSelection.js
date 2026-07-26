const path = require('path');

const LEGACY_RENDERER = 'legacy';
const VUE_RENDERER = 'vue';

function normalizeRendererMode(value) {
  return String(value || '').trim().toLowerCase() === LEGACY_RENDERER
    ? LEGACY_RENDERER
    : VUE_RENDERER;
}

function resolveRendererFile(value, appRoot) {
  const root = appRoot || __dirname;
  return normalizeRendererMode(value) === LEGACY_RENDERER
    ? path.join(root, 'index.html')
    : path.join(root, 'signboard-vue', 'dist', 'index.html');
}

module.exports = {
  LEGACY_RENDERER,
  VUE_RENDERER,
  normalizeRendererMode,
  resolveRendererFile,
};
