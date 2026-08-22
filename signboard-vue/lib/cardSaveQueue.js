// Framework-free card-save helpers used by the canonical Vue renderer.

/**
 * A small latest-value debounce in front of a strictly serialized writer.
 * The writer is never run concurrently and flush() always waits for the last
 * queued value, including a value added while an earlier write is in flight.
 */
export function createSerializedSaveQueue({ delay = 300, save, onError } = {}) {
  if (typeof save !== 'function') throw new TypeError('save must be a function')

  let timer = null
  let pending = undefined
  let hasPending = false
  let running = Promise.resolve()
  let generation = 0

  function reportError(error) {
    if (typeof onError === 'function') onError(error)
  }

  function runPending() {
    if (!hasPending) return running
    const value = pending
    pending = undefined
    hasPending = false
    const runGeneration = generation
    running = running
      .then(async () => {
        if (runGeneration !== generation) return
        await save(value)
      })
      .catch((error) => {
        reportError(error)
      })
    return running
  }

  function enqueue(value) {
    pending = value
    hasPending = true
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      runPending()
    }, Math.max(0, Number(delay) || 0))
    return running
  }

  async function flush() {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
      runPending()
    }
    await running
    if (hasPending) {
      runPending()
      await running
    }
  }

  function cancel() {
    if (timer !== null) clearTimeout(timer)
    timer = null
    pending = undefined
    hasPending = false
    generation += 1
  }

  return {
    enqueue,
    flush,
    cancel,
    get pending() { return hasPending || timer !== null },
  }
}
