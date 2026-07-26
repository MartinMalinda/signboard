import { onBeforeUnmount, onMounted, type Ref } from 'vue'

export interface SortableEventLike {
  item: HTMLElement
  from: HTMLElement
  to: HTMLElement
  oldIndex?: number
  newIndex?: number
}

interface SortableInstance {
  destroy: () => void
}

interface SortableConstructor {
  new (element: HTMLElement, options: Record<string, unknown>): SortableInstance
  active?: { item?: HTMLElement } | null
  ghost?: HTMLElement | null
}

interface SortableOptions {
  draggable: string
  group?: string | { name: string; pull?: boolean; put?: boolean | string[] }
  onEnd: (event: SortableEventLike) => void | Promise<void>
  kind?: 'cards' | 'lists' | 'settings'
  forceFallback?: boolean
  fallbackOnBody?: boolean
  fallbackTolerance?: number
  filter?: string
  animation?: number
}

type SortableTarget = Ref<HTMLElement | null> | (() => HTMLElement | null)

function getSortableConstructor() {
  return (window as Window & { Sortable?: SortableConstructor }).Sortable
}

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function clearSelection() {
  window.getSelection?.()?.removeAllRanges()
}

function isCard(element: HTMLElement | null) {
  return Boolean(element?.classList.contains('card'))
}

function createDragLifecycle(kind: 'cards' | 'lists' | 'settings', sortable: () => SortableConstructor | undefined) {
  let dragItem: HTMLElement | null = null
  let startX: number | null = null
  let targets: HTMLElement[] = []

  function getPointer(event: Event | undefined) {
    const source = event as MouseEvent & { touches?: TouchList; changedTouches?: TouchList } | undefined
    const pointer = source?.touches?.[0] || source?.changedTouches?.[0] || source
    return pointer && typeof pointer.clientX === 'number' ? pointer : null
  }

  function clearTilt() {
    for (const target of targets) target.style.removeProperty('--card-drag-tilt')
    targets = []
  }

  function updateTilt(event: Event) {
    if (kind !== 'cards' || !dragItem) return
    const pointer = getPointer(event)
    if (!pointer) return
    startX ??= pointer.clientX
    const delta = pointer.clientX - startX
    const deadZone = 12
    const distance = Math.min(Math.max(0, Math.abs(delta) - deadZone) / 56, 1)
    const degrees = distance * 1.5 * (delta < 0 ? -1 : 1)
    const ctor = sortable()
    const nextTargets = [dragItem, ...(ctor?.ghost && ctor.ghost !== dragItem ? [ctor.ghost] : [])]
    for (const previous of targets) if (!nextTargets.includes(previous)) previous.style.removeProperty('--card-drag-tilt')
    for (const target of nextTargets) target.style.setProperty('--card-drag-tilt', `${degrees.toFixed(2)}deg`)
    targets = nextTargets
  }

  function onPointerMove(event: Event) { updateTilt(event) }
  function removeListeners() {
    document.removeEventListener('mousemove', onPointerMove)
    document.removeEventListener('touchmove', onPointerMove)
    document.removeEventListener('pointermove', onPointerMove)
  }
  function begin(event: SortableEventLike) {
    dragItem = event.item
    startX = null
    if (kind === 'cards' && !prefersReducedMotion()) {
      document.addEventListener('mousemove', onPointerMove, { passive: true })
      document.addEventListener('touchmove', onPointerMove, { passive: true })
      document.addEventListener('pointermove', onPointerMove, { passive: true })
      updateTilt(event as unknown as Event)
    }
  }
  function end(event?: SortableEventLike) {
    removeListeners()
    if (event?.item) event.item.style.removeProperty('--card-drag-tilt')
    clearTilt()
    dragItem = null
    startX = null
  }

  return {
    onChoose: () => {
      if (kind === 'cards') {
        document.body.classList.add('board-card-drag-active')
        clearSelection()
      }
    },
    onStart: begin,
    onEnd: end,
    onUnchoose: () => {
      if (kind === 'cards') document.body.classList.remove('board-card-drag-active')
    },
    cleanup: () => {
      end()
      document.body.classList.remove('board-card-drag-active')
    },
  }
}

export function useSortable(target: SortableTarget, options: SortableOptions) {
  let instance: SortableInstance | null = null
  const kind = options.kind || 'cards'
  const lifecycle = createDragLifecycle(kind, () => getSortableConstructor())

  function getTarget() {
    return typeof target === 'function' ? target() : target.value
  }

  function destroy() {
    instance?.destroy()
    instance = null
    lifecycle.cleanup()
  }

  function initialize() {
    destroy()
    const ctor = getSortableConstructor()
    const element = getTarget()
    if (!ctor || !element) return null
    const forceFallback = options.forceFallback ?? true
    instance = new ctor(element, {
      forceFallback,
      fallbackOnBody: options.fallbackOnBody ?? forceFallback,
      // Ignore small pointer wobble so a click on a card does not become a drag.
      fallbackTolerance: options.fallbackTolerance ?? (kind === 'cards' ? 5 : 0),
      fallbackClass: kind === 'cards' ? 'card-sortable--fallback' : 'list-sortable--fallback',
      chosenClass: kind === 'cards' ? 'card-sortable--chosen' : 'list-sortable--chosen',
      ghostClass: kind === 'cards' ? 'card-sortable--ghost' : 'list-sortable--ghost',
      dragClass: kind === 'cards' ? 'card-sortable--dragging' : 'list-sortable--dragging',
      animation: prefersReducedMotion() ? 0 : (options.animation ?? 150),
      draggable: options.draggable,
      group: options.group,
      filter: options.filter ?? (kind === 'lists' ? '.add-list-phantom, .list-actions-button' : undefined),
      onChoose: lifecycle.onChoose,
      onStart: lifecycle.onStart,
      onUnchoose: lifecycle.onUnchoose,
      onEnd: async (event: SortableEventLike) => {
        try { await options.onEnd(event) } finally { lifecycle.onEnd(event) }
      },
    })
    return instance
  }

  onMounted(initialize)
  onBeforeUnmount(destroy)

  return { initialize, destroy, get instance() { return instance } }
}
