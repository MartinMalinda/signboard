import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import RichTextEditor from '../lib/components/RichTextEditor.vue'

describe('Task 15 Tiptap card notes editor', () => {
  let mounted: ReturnType<typeof mount> | undefined

  afterEach(() => mounted?.unmount())

  it('parses Markdown task lists into accessible native checkboxes and serializes changes as Markdown', async () => {
    mounted = mount(RichTextEditor, {
      props: {
        modelValue: '# Plan\n\n- [ ] Parent task\n  - [x] Nested task\n\n> Keep this note',
      },
    })

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(mounted.find('#cardEditorNotes').attributes('contenteditable')).toBe('true')
    expect(mounted.findAll('input[type="checkbox"]')).toHaveLength(2)
    expect(mounted.find('h1').text()).toBe('Plan')

    await mounted.findAll('input[type="checkbox"]')[0]!.setValue(true)
    const updates = mounted.emitted('update:modelValue') || []
    const latest = updates[updates.length - 1]?.[0] as string
    expect(latest).toContain('- [x] Parent task')
    expect(latest).toContain('  - [x] Nested task')
    expect(latest).not.toContain('<h1>')
  })

  it('updates clean external content without emitting a local draft change and rejects base64 images', async () => {
    mounted = mount(RichTextEditor, { props: { modelValue: 'Original note' } })
    await new Promise((resolve) => setTimeout(resolve, 0))
    const component = mounted.vm as unknown as { setExternalBody: (value: string) => void; getMarkdown: () => string }

    component.setExternalBody('Updated note\n\n![unsafe](data:image/png;base64,abc123)')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(component.getMarkdown()).toContain('Updated note')
    expect(component.getMarkdown()).not.toContain('data:image/')
    expect(mounted.emitted('update:modelValue')).toBeUndefined()
  })

  it('decorates raw URLs without converting them into persisted links', async () => {
    const openExternal = vi.fn()
    window.electronAPI = { openExternal } as never
    mounted = mount(RichTextEditor, { props: { modelValue: 'Read https://example.test/docs.' } })
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mounted.find('.card-editor-body-url-text').text()).toBe('https://example.test/docs')
    await mounted.find('.card-editor-body-url-open').trigger('click')
    expect(openExternal).toHaveBeenCalledWith('https://example.test/docs')
    expect((mounted.vm as unknown as { getMarkdown: () => string }).getMarkdown()).toContain('https://example.test/docs.')
  })

  it('renders compact card links and opens a title/action menu after a hover delay', async () => {
    const openExternal = vi.fn()
    window.electronAPI = { openExternal } as never
    mounted = mount(RichTextEditor, { attachTo: document.body, props: { modelValue: '[Related card](signboard://open-card?id=Ab123)' } })
    await new Promise((resolve) => setTimeout(resolve, 0))

    const link = mounted.find('a.card-editor-card-link')
    expect(link.exists()).toBe(true)
    expect(link.attributes('data-card-link')).toBe('signboard://open-card?id=Ab123')
    await link.trigger('mouseover')
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(document.body.querySelector('#cardEditorCardLinkPopover')?.getAttribute('aria-hidden')).toBe('true')
    await new Promise((resolve) => setTimeout(resolve, 180))
    const menu = document.body.querySelector<HTMLElement>('#cardEditorCardLinkPopover')
    expect(menu?.getAttribute('aria-hidden')).toBe('false')
    expect(menu?.querySelector('.card-editor-card-link-menu-title')?.textContent).toBe('Related card')
    expect(openExternal).not.toHaveBeenCalled()

    const visit = Array.from(menu?.querySelectorAll<HTMLButtonElement>('button') || []).find((button) => button.textContent === 'Open')
    visit?.click()
    expect(openExternal).toHaveBeenCalledWith('signboard://open-card?id=Ab123')
  })

  it('opens the link editor from the card-link menu', async () => {
    mounted = mount(RichTextEditor, { attachTo: document.body, props: { modelValue: '[Related card](signboard://open-card?id=Ab123)' } })
    await new Promise((resolve) => setTimeout(resolve, 0))

    await mounted.find('a.card-editor-card-link').trigger('mouseover')
    await new Promise((resolve) => setTimeout(resolve, 320))
    const menu = document.body.querySelector<HTMLElement>('#cardEditorCardLinkPopover')
    const edit = Array.from(menu?.querySelectorAll<HTMLButtonElement>('button') || []).find((button) => button.textContent === 'Edit')
    edit?.click()
    await nextTick()
    await nextTick()

    expect(document.body.querySelector('#modalCardEditorLink')).toBeTruthy()
    expect(document.body.querySelector<HTMLInputElement>('#modalCardEditorLink input[type="url"]')?.value).toBe('signboard://open-card?id=Ab123')
  })

  it('resolves relative Markdown card links from the current card path', async () => {
    const openCard = vi.fn()
    mounted = mount(RichTextEditor, {
      props: {
        modelValue: '[Related card](../Doing/related-card.md)',
        cardPath: '/boards/Example/To-do/current-card.md',
        onOpenCard: openCard,
      },
    })
    await new Promise((resolve) => setTimeout(resolve, 0))

    const link = mounted.find('a.card-editor-card-link')
    expect(link.exists()).toBe(true)
    await link.trigger('click')
    expect(openCard).toHaveBeenCalledWith('/boards/Example/Doing/related-card.md', { stack: true })
  })

  it('keeps fenced code blocks separate from inline code styling', async () => {
    mounted = mount(RichTextEditor, {
      props: {
        modelValue: 'Inline `foo`\n\n```ts\ntype NormalizedEvent = {\n  baseId: string;\n}\n```',
      },
    })
    await new Promise((resolve) => setTimeout(resolve, 0))

    const inlineCode = mounted.find('p code')
    const fencedCode = mounted.find('pre code')
    expect(inlineCode.exists()).toBe(true)
    expect(fencedCode.exists()).toBe(true)
    expect(fencedCode.element.parentElement?.tagName).toBe('PRE')
    expect(fencedCode.text()).toContain('type NormalizedEvent')
  })

  it('highlights fenced TypeScript without changing the Markdown representation', async () => {
    const markdown = '```ts\nconst value: string = "ok"\n```'
    mounted = mount(RichTextEditor, { props: { modelValue: markdown } })

    await vi.waitFor(() => expect(mounted?.findAll('pre .shiki').length).toBeGreaterThan(0), { timeout: 3000 })

    expect((mounted.vm as unknown as { getMarkdown: () => string }).getMarkdown()).toContain(markdown)
    expect(mounted.find('pre').attributes('style')).toContain('--prosemirror-highlight')
  })
})
