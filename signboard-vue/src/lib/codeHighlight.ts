import { createHighlightPlugin } from 'prosemirror-highlight'
import { createParser, type Parser } from 'prosemirror-highlight/shiki'
import { createBundledHighlighter } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { Extension } from '@tiptap/core'

const SHIKI_THEMES = ['github-light', 'github-dark'] as const
const SHIKI_LANGUAGES = [
  'bash',
  'css',
  'html',
  'javascript',
  'json',
  'markdown',
  'python',
  'sql',
  'typescript',
  'yaml',
] as const

const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  md: 'markdown',
  py: 'python',
  sh: 'bash',
  ts: 'typescript',
  tsx: 'typescript',
  yml: 'yaml',
}

const createSignboardHighlighter = createBundledHighlighter({
  langs: {
    bash: () => import('@shikijs/langs/bash'),
    css: () => import('@shikijs/langs/css'),
    html: () => import('@shikijs/langs/html'),
    javascript: () => import('@shikijs/langs/javascript'),
    json: () => import('@shikijs/langs/json'),
    markdown: () => import('@shikijs/langs/markdown'),
    python: () => import('@shikijs/langs/python'),
    sql: () => import('@shikijs/langs/sql'),
    typescript: () => import('@shikijs/langs/typescript'),
    yaml: () => import('@shikijs/langs/yaml'),
  },
  themes: {
    'github-light': () => import('@shikijs/themes/github-light'),
    'github-dark': () => import('@shikijs/themes/github-dark'),
  },
  engine: () => createJavaScriptRegexEngine(),
})

type SignboardHighlighter = Awaited<ReturnType<typeof createSignboardHighlighter>>

let highlighter: SignboardHighlighter | null = null
let highlighterPromise: Promise<SignboardHighlighter> | null = null
let parser: Parser | null = null

function normalizeLanguage(language?: string) {
  const normalized = String(language || '').trim().toLowerCase()
  return LANGUAGE_ALIASES[normalized] || normalized
}

function loadHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createSignboardHighlighter({
      themes: [...SHIKI_THEMES],
      langs: [...SHIKI_LANGUAGES],
    }).then((instance) => {
      highlighter = instance
      return instance
    })
  }
  return highlighterPromise
}

const highlightParser: Parser = (options) => {
  if (!highlighter) return loadHighlighter().then(() => undefined)

  const language = normalizeLanguage(options.language)
  if (!language) return []

  try {
    parser ||= createParser(highlighter, {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: 'light',
    })
    return parser({ ...options, language })
  } catch {
    return []
  }
}

export const codeHighlightExtension = Extension.create({
  name: 'signboardCodeHighlight',
  addProseMirrorPlugins() {
    return [createHighlightPlugin({ parser: highlightParser })]
  },
})
