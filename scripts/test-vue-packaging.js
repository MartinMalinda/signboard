const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const requiredFiles = [
  'signboard-vue/dist/index.html',
  'static/vendor/sortable-1.15.2.min.js',
  'static/vendor/feather-4.29.2.min.js',
  'static/vendor/overtype-1.26.0.min.js',
  'static/vendor/fdatepicker-3.0.24.min.js',
  'static/vendor/fdatepicker.en-3.0.24.js',
];

for (const relativePath of requiredFiles) {
  const absolutePath = path.join(root, relativePath);
  assert.ok(fs.existsSync(absolutePath), `Missing packaged renderer asset: ${relativePath}`);
}

const builderConfig = JSON.parse(fs.readFileSync(path.join(root, 'electron-builder.json'), 'utf8'));
const packageFiles = builderConfig.files || [];
assert.ok(packageFiles.includes('signboard-vue/dist/**'), 'electron-builder must package the Vue dist');
assert.ok(packageFiles.includes('static/**'), 'electron-builder must package shared and vendor assets');
assert.ok(packageFiles.includes('index.html'), 'electron-builder must retain the legacy rollback renderer');

console.log('Vue packaging checks passed.');
