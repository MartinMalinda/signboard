const assert = require('assert');
const path = require('path');
const {
  LEGACY_RENDERER,
  VUE_RENDERER,
  normalizeRendererMode,
  resolveRendererFile,
} = require('../lib/rendererSelection');

const appRoot = '/signboard';

assert.strictEqual(normalizeRendererMode(undefined), VUE_RENDERER);
assert.strictEqual(normalizeRendererMode('vue'), VUE_RENDERER);
assert.strictEqual(normalizeRendererMode('unexpected'), VUE_RENDERER);
assert.strictEqual(normalizeRendererMode(' legacy '), LEGACY_RENDERER);
assert.strictEqual(resolveRendererFile(undefined, appRoot), path.join(appRoot, 'signboard-vue', 'dist', 'index.html'));
assert.strictEqual(resolveRendererFile('vue', appRoot), path.join(appRoot, 'signboard-vue', 'dist', 'index.html'));
assert.strictEqual(resolveRendererFile('legacy', appRoot), path.join(appRoot, 'index.html'));

console.log('Renderer selection checks passed.');
