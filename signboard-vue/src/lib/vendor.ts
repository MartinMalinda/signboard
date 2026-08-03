// Loads the same vendored global libraries the legacy renderer uses
// (static/vendor/*.js) via classic script tags, preserving exact browser
// global semantics: Sortable, feather, and FDatepicker on window.
// (Bundling them broke UMD global attachment for several of the libs.)
// Paths are relative to the built index.html location, matching how the
// legacy ../index.html references them.
// Components must access these globals through single wrapper points only
// (see vue-styleguide.md §6).
const VENDOR_BASE = '../../static/vendor/'

const SCRIPTS = [
  'sortable-1.15.2.min.js',
  'feather-4.29.2.min.js',
  'fdatepicker-3.0.24.min.js',
  'fdatepicker.en-3.0.24.js',
]

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script')
    el.src = src
    el.onload = () => resolve()
    el.onerror = () => reject(new Error(`Failed to load vendor script: ${src}`))
    document.head.appendChild(el)
  })
}

export async function loadVendorGlobals(): Promise<void> {
  // Sequential: fdatepicker.en depends on the main fdatepicker global.
  for (const file of SCRIPTS) {
    await loadScript(VENDOR_BASE + file)
  }
}
