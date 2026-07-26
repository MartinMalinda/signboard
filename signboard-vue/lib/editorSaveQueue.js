// Framework-free editor persistence. The queue mirrors the legacy 300ms debounce
// and serializes every write so a slow write cannot be overtaken by a newer one.

export function createEditorSaveQueue({ save, delay = 300, now = () => Date.now() }) {
  let timer = null;
  let pending = null;
  let inFlight = Promise.resolve();
  let generation = 0;

  function enqueue(value) {
    pending = { value, generation: generation + 1, queuedAt: now() };
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      drainPending();
    }, delay);
    return inFlight;
  }

  function drainPending() {
    const next = pending;
    pending = null;
    if (!next) return inFlight;
    inFlight = inFlight
      .then(() => save(next.value, { generation: next.generation, queuedAt: next.queuedAt }))
      .catch(() => undefined);
    return inFlight;
  }

  async function flush() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
      drainPending();
    }
    await inFlight;
    if (pending) {
      drainPending();
      await inFlight;
    }
  }

  function invalidate() {
    generation += 1;
    if (timer !== null) clearTimeout(timer);
    timer = null;
    pending = null;
  }

  function clear() {
    invalidate();
  }

  return {
    enqueue,
    flush,
    clear,
    invalidate,
    get pending() { return pending !== null; },
    get saving() { return timer !== null || pending !== null; },
    get inFlight() { return inFlight; },
  };
}

export function serializeEditorState(frontmatter, body) {
  return JSON.stringify({ frontmatter: frontmatter || {}, body: typeof body === 'string' ? body : '' });
}
