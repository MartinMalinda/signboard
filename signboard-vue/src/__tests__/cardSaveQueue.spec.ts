import { describe, expect, it, vi } from 'vitest'
import { createSerializedSaveQueue } from '../../lib/cardSaveQueue.js'

describe('createSerializedSaveQueue', () => {
  it('debounces rapid edits to the latest value', async () => {
    const saved: string[] = []
    const queue = createSerializedSaveQueue({ delay: 5, save: async (value: string) => saved.push(value) })
    queue.enqueue('a'); queue.enqueue('ab'); queue.enqueue('abc')
    await queue.flush()
    expect(saved).toEqual(['abc'])
  })

  it('serializes a new value added while a write is in flight', async () => {
    const saved: string[] = []
    let release: (() => void) | undefined
    const firstWrite = new Promise<void>((resolve) => { release = resolve })
    const queue = createSerializedSaveQueue({ delay: 0, save: async (value: string) => { if (value === 'first') await firstWrite; saved.push(value) } })
    queue.enqueue('first')
    await new Promise((resolve) => setTimeout(resolve, 0))
    queue.enqueue('second')
    release?.()
    await queue.flush()
    expect(saved).toEqual(['first', 'second'])
  })

  it('does not let a cancelled generation write after close', async () => {
    const save = vi.fn(async () => {})
    const queue = createSerializedSaveQueue({ delay: 10, save })
    queue.enqueue('stale')
    queue.cancel()
    await queue.flush()
    expect(save).not.toHaveBeenCalled()
  })
})

