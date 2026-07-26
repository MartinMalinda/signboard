import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { addLinkedObject, normalizeCardLinkedObjects, removeLinkedObject } from '../../lib/linkedObjects.js'
import { applySmartActionPreview, normalizePreview } from '../../lib/smartActions.js'
import { findRawUrls, markRawUrls } from '../../lib/rawUrls.js'
import LinkedObjectChip from '../components/editor/LinkedObjectChip.vue'
import SmartActionPreview from '../components/editor/SmartActionPreview.vue'

describe('Task 10 editor extras pure contracts', () => {
  it('deduplicates structured links and reconciles legacy related wikilinks/URLs', () => {
    const objects = normalizeCardLinkedObjects({
      linked_objects: [{ type: 'obsidian-note', target: '[[Notes/Plan.md]]' }, { type: 'url', url: 'https://example.test/' }],
      related: ['[[Notes/Plan.md]]', 'https://example.test/'],
    })
    expect(objects).toHaveLength(2)
    expect(objects[0]?.type).toBe('obsidian-note')
    expect(addLinkedObject(objects, { type: 'url', url: 'https://example.test/' })).toHaveLength(2)
    expect(removeLinkedObject({ linked_objects: objects, related: ['[[Notes/Plan.md]]', 'https://example.test/'] }, objects[0]!)).toEqual({ linked_objects: [{ type: 'url', title: 'https://example.test/', url: 'https://example.test/' }], related: ['https://example.test/'] })
  })

  it('keeps Smart Action output preview-only until explicit apply and appends content', () => {
    const state = { title: 'Old', body: 'Existing', frontmatter: { labels: ['one'] }, linkedObjects: [] }
    const result = { actionType: 'custom', actionTarget: 'content', body: 'Generated section', ok: true }
    const preview = normalizePreview(result, { id: 'custom', type: 'custom', target: 'content' })
    expect(state.body).toBe('Existing')
    expect(preview.body).toBe('Generated section')
    expect(applySmartActionPreview(state, result, { action: { type: 'custom', target: 'content' } }).body).toBe('Existing\n\nGenerated section')
  })

  it('does not apply Question the Card output and only merges existing labels', () => {
    const state = { title: 'Old', body: 'Existing', frontmatter: { labels: ['one'] }, linkedObjects: [] }
    expect(applySmartActionPreview(state, { actionType: 'answer', answer: 'Answer' }, { action: { type: 'question' } })).toEqual(state)
    const next = applySmartActionPreview(state, { actionType: 'labels', labels: ['Review', 'not-on-board'] }, { action: { type: 'labels', target: 'labels' }, availableLabels: [{ id: 'review-id', name: 'Review' }] })
    expect((next.frontmatter as { labels: string[] }).labels).toEqual(['one', 'review-id'])
  })

  it('marks raw web URLs without changing their Markdown source', () => {
    const source = 'See www.example.com/docs, and https://example.test/a.'
    const matches = findRawUrls(source)
    expect(matches.map((item) => item.url)).toEqual(['https://www.example.com/docs', 'https://example.test/a'])
    expect(markRawUrls(source).filter((part) => part.type === 'url')).toHaveLength(2)
    expect(source).toContain('www.example.com')
  })

  it('renders linked-object missing/recreate controls and Smart Action preview actions', async () => {
    const onOpen = vi.fn(); const onRemove = vi.fn(); const onRecreate = vi.fn(); const onRelink = vi.fn()
    const chip = mount(LinkedObjectChip, { props: { object: { type: 'obsidian-note', title: 'Plan', target: '[[Plan]]' }, status: { missing: true }, onOpen, onRemove, onRecreate, onRelink } })
    expect(chip.find('.card-editor-related-note-recreate').exists()).toBe(true)
    await chip.find('.card-editor-related-note-open').trigger('click')
    expect(onOpen).toHaveBeenCalled()
    const preview = mount(SmartActionPreview, { props: { result: { actionType: 'custom', body: 'Generated' }, action: { type: 'custom', target: 'content' }, onApply: vi.fn(), onBack: vi.fn() } })
    expect(preview.text()).toContain('Generated')
    expect(preview.find('.card-editor-ai-tasks-primary').exists()).toBe(true)
  })
})
