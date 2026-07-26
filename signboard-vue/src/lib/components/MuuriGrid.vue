<script setup generic="T extends { id: string | number }" lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import Muuri from "muuri";
import type { GridOptions } from "muuri";

const props = defineProps<{
  items: T[];
  dragEnabled: boolean;
  onSort: (items: T[]) => void;
  dragAxis?: GridOptions["dragAxis"];
}>();

const gridElement = ref<HTMLElement | null>(null);

let grid: Muuri | null = null;
let ro: ResizeObserver | null = null;
let observed = new Set<Element>();

const isDragging = ref(false);

let pending = false;
function requestRelayout() {
  if (!grid || isDragging.value) return;
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => {
    pending = false;
    if (!grid) return;
    grid.refreshItems().layout();
  });
}

function rewireResizeObservers() {
  if (!gridElement.value || !ro) return;

  const targets = Array.from(gridElement.value.children);

  for (const el of observed) {
    if (!targets.includes(el as Element)) {
      ro.unobserve(el as Element);
      observed.delete(el as Element);
    }
  }

  for (const el of targets) {
    if (!observed.has(el)) {
      ro.observe(el);
      observed.add(el);
    }
  }
}

const syncGrid = async () => {
  if (!grid || !gridElement.value) return;

  await nextTick();

  const items = grid.getItems();
  const itemElements = items.map((item) => item.getElement());
  const newItemElements = Array.from(gridElement.value.children);

  const toAdd = newItemElements.filter(
    (el) => !itemElements.includes(el as HTMLElement),
  );
  const toRemove = items.filter(
    (item) => !newItemElements.includes(item.getElement()!),
  );

  grid.add(toAdd as HTMLElement[]);
  grid.remove(toRemove);

  const newItems = grid.getItems();
  const sortedItems = newItemElements.map(
    (el) => newItems.find((item) => item.getElement() === el)!,
  );
  grid.sort(sortedItems);

  rewireResizeObservers();

  grid.refreshItems().layout();
};

onMounted(async () => {
  if (!gridElement.value) return;

  await nextTick();
  if (!gridElement.value || !document.documentElement.contains(gridElement.value)) return;

  grid = new Muuri(gridElement.value, {
    dragEnabled: props.dragEnabled,
    dragHandle: ".handle",
    dragAxis: props.dragAxis,
  });

  let draggingEl: HTMLElement | null = null;

  grid.on("dragInit", (item) => {
    const el = item.getElement()!;
    draggingEl = el;

    el.style.width = item.getWidth() + "px";

    isDragging.value = true;
  });

  grid.on("dragEnd", () => {
    isDragging.value = false;

    if (draggingEl) {
      draggingEl.style.width = "";
      draggingEl.style.height = "";
      draggingEl = null;
    }

    const itemIds = grid!.getItems().map((item) => {
      const el = item.getElement();
      const id = el?.getAttribute("data-id");
      if (!id) throw new Error("[data-id] is missing");
      return id;
    });

    props.onSort(itemIds.map((id) => props.items.find((it) => String(it.id) === id)!));

    requestRelayout();
  });

  ro = new ResizeObserver(() => requestRelayout());
  rewireResizeObservers();

  requestAnimationFrame(syncGrid);
});

onBeforeUnmount(() => {
  ro?.disconnect();
  ro = null;
  observed.clear();
  grid?.destroy();
  grid = null;
});

watch(
  () => props.items.map((item) => item.id).join("|"),
  () => requestAnimationFrame(syncGrid),
);
</script>

<template>
  <div ref="gridElement" class="grid">
    <slot
      v-for="(item, index) in items"
      :item="item"
      :index="index"
      :key="item.id"
    />
  </div>
</template>

<style lang="scss">
.muuri {
  transition: 0.1s height;
}

.grid {
  position: relative;
}

.muuri-item {
  transition: 0.2s box-shadow;
  position: absolute;
}

.muuri-item-dragging {
  z-index: 4 !important;
  background: white;
  border-radius: 5px;
}
.muuri-item-releasing {
  z-index: 2;
}
.muuri-item-hidden {
  z-index: 0;
}
</style>
