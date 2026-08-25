<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useEditorStore } from '../../stores/useEditorStore'
import { useLabelsStore } from '../../stores/useLabelsStore'
import RichTextEditor from '../../lib/components/RichTextEditor.vue'
import CardLabelPopover from '../board/CardLabelPopover.vue'
import FeatherIcon from '../FeatherIcon.vue'
import V2WorkControls from './V2WorkControls.vue'
import V2ScoreSummary from './V2ScoreSummary.vue'

const editorStore = useEditorStore()
const labelsStore = useLabelsStore()
const props = defineProps<{ onOpenCard?: (path: string, options?: { focusNotes?: boolean; stack?: boolean }) => void | Promise<void>; onOpenV2Details?: () => void; v2Enabled?: boolean; listPaths?: string[]; onMove?: (path: string) => Promise<boolean> }>()
const labelsOpen = ref(false)
const labelOpener = ref<HTMLElement | null>(null)
const selectedLabelIds = computed(() => Array.isArray(editorStore.frontmatter.labels) ? editorStore.frontmatter.labels.map(String) : [])
const selectedLabels = computed(() => selectedLabelIds.value.map((id) => labelsStore.labels.find((label) => label.id === id) || { id, name: 'Unknown label', colorLight: '#94a3b8' }))
const visibleLabels = computed(() => selectedLabels.value.slice(0, 3))
const hiddenLabelCount = computed(() => Math.max(0, selectedLabels.value.length - visibleLabels.value.length))
const tiptap = ref<InstanceType<typeof RichTextEditor> | null>(null)
function setExternalBody(value: string) {
  tiptap.value?.setExternalBody(value)
}
function focus() {
  tiptap.value?.focus()
}

function toggleLabels(event: MouseEvent) {
  labelOpener.value = event.currentTarget as HTMLElement
  labelsOpen.value = !labelsOpen.value
}

function closeLabels() {
  labelsOpen.value = false
  void labelOpener.value?.focus()
}

async function saveLabels(ids: string[]) {
  await editorStore.setLabels(ids)
}

watch(() => editorStore.isOpen, (isOpen) => {
  if (!isOpen) labelsOpen.value = false
})

defineExpose({ setExternalBody, focus })
</script>
<template>
  <div class="card-editor-notes-implementation">
    <RichTextEditor ref="tiptap" :model-value="editorStore.body" :card-path="editorStore.cardPath" :on-open-card="props.onOpenCard" @update:model-value="editorStore.setBody">
      <template #toolbar-end>
        <div class="card-editor-tiptap-toolbar-end">
          <div class="card-editor-metadata-segment" role="group" aria-label="Card metadata">
            <V2WorkControls v-if="props.v2Enabled && props.listPaths?.length && props.onMove" :list-paths="props.listPaths" :on-move="props.onMove" />
            <button ref="labelOpener" type="button" class="card-editor-tiptap-label-trigger" :class="{ 'has-labels': selectedLabelIds.length }" title="Set labels" :aria-label="selectedLabelIds.length ? `Set labels: ${selectedLabels.map((label) => label.name).join(', ')}` : 'Set labels'" aria-haspopup="menu" :aria-expanded="labelsOpen" @click="toggleLabels">
              <FeatherIcon name="tag" />
              <span v-for="label in visibleLabels" :key="label.id" class="card-editor-tiptap-label-chip" :style="{ backgroundColor: `${label.colorLight || '#94a3b8'}22`, borderColor: label.colorLight || '#94a3b8' }">{{ label.name }}</span>
              <span v-if="hiddenLabelCount" class="card-editor-tiptap-label-more">and {{ hiddenLabelCount }} more</span>
              <FeatherIcon name="chevron-down" />
            </button>
          </div>
          <V2ScoreSummary v-if="props.v2Enabled" :on-open-details="props.onOpenV2Details" />
          <CardLabelPopover :is-open="labelsOpen" :opener="labelOpener" :card-path="editorStore.cardPath" :board-root="editorStore.boardPathForCard(editorStore.cardPath)" :labels="labelsStore.labels" :selected-ids="selectedLabelIds" :on-close="closeLabels" :on-save="saveLabels" />
        </div>
      </template>
    </RichTextEditor>
  </div>
</template>
