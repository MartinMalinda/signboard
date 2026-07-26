<script
  setup
  lang="ts"
  generic="T extends { id: string; name: string; emoji?: string; color?: string }"
>
import { ref, shallowRef, computed, watch, nextTick } from "vue";
import Dropdown from "./Dropdown.vue";
import Input from "./Input.vue";
import Chevron from "./Chevron.vue";
import TagButton from "./TagButton.vue";
import { useHighlightedItem } from "../utils/select";

const props = defineProps<{
  label?: string;
  placeholder?: string;
  hideSearch?: boolean;
  allowBlank?: boolean;
  allowCreate?: boolean;
  choices: T[];
  selectedChoice: T | undefined;
  onSelect: (option: T | undefined) => void;
  onCreate?: (name: string) => Promise<T | void> | T | void; // create new entry
  onCreateError?: (message: string) => void;
  horizontalPosition?: "right" | "center" | "left" | "auto";
  showBorder?: boolean;
  width?: number;
  testId?: string;
  fullWidth?: boolean;
}>();

// internal create state
const isCreating = ref(false);
// local copy to support creation
const localChoices = shallowRef<T[]>([...props.choices]);
const query = ref("");

const filteredChoices = computed(() => {
  try {
    return localChoices.value.filter((choice) =>
      choice.name.toLowerCase().includes(query.value.toLowerCase()),
    );
  } catch (e) {
    debugger;
  }
});

const {
  highlightedItem: highlightedChoice,
  handleArrowDown,
  handleArrowUp,
  scrollIntoView,
} = useHighlightedItem(filteredChoices as any);

const selectChoice = (choice: T | undefined) => {
  props.onSelect(choice);
};

// sync external choices updates
watch(
  () => props.choices,
  (newList) => {
    localChoices.value = [...newList];
  },
  { deep: true },
);

const handleEnter = (close: () => void) => {
  if (highlightedChoice.value) {
    selectChoice(highlightedChoice.value as T);
    query.value = "";
    close();
  } else {
    handleCreate(close);
  }
};

const inputRef = ref<HTMLInputElement | null>(null);
const optionsRef = ref<HTMLElement | null>(null);

const focusMenu = () => {
  nextTick(() => {
    highlightedChoice.value =
      filteredChoices.value?.find((choice) => choice.id === props.selectedChoice?.id) ||
      filteredChoices.value?.[0];
    scrollIntoView({ behavior: "instant" });

    if (!props.hideSearch && inputRef.value) {
      const el = (inputRef.value as any)?.$el as HTMLElement | undefined;
      const input = el?.querySelector("input") as HTMLInputElement | null;
      input?.focus();
    } else {
      optionsRef.value?.focus();
    }
  });
};

const handleKeyDown = (event: KeyboardEvent, close) => {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    handleArrowDown();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    handleArrowUp();
  } else if (event.key === "Enter") {
    event.preventDefault();
    handleEnter(close);
  }
};
// handle creation of new item
const handleCreate = async (close: () => void) => {
  if (!props.onCreate) return;
  isCreating.value = true;
  try {
    const newOpt = await props.onCreate(query.value);
    if (newOpt) {
      localChoices.value = [...localChoices.value, newOpt as T];
      selectChoice(newOpt);
    }
    close();
    query.value = "";
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Create option failed", e);
    props.onCreateError?.(message);
  } finally {
    isCreating.value = false;
  }
};
</script>

<template>
  <div
    class="single-select flex gap-1 flex-wrap"
    :class="{ border: showBorder, w100p: fullWidth !== false }"
  >
    <Dropdown
      :teleport="true"
      position="auto"
      :width="width"
      class="single-select-dropdown"
      :class="{ w100p: fullWidth !== false }"
      :padding="false"
      :horizontal-position="props.horizontalPosition || 'left'"
      triggerClass="medium"
      :onOpen="focusMenu"
      :testId="testId"
    >
      <template #trigger="{ open, close, isOpen }">
        <slot
          v-if="$slots.trigger"
          name="trigger"
          :open="open"
          :close="close"
          :isOpen="isOpen"
          :selectedChoice="selectedChoice"
          :label="label"
        />
        <div
          v-else
          class="trigger-content flex ai-center medium jc-space-between w100p"
          :aria-label="label"
        >
          <div class="selected-choice-wrap w100p">
            <TagButton
              v-if="selectedChoice"
              :choice="selectedChoice"
              :hide-cross="true"
            >
              <slot name="selected-choice" :choice="selectedChoice">
                <slot name="choice" :choice="selectedChoice" />
              </slot>
            </TagButton>
            <div v-else class="single-select-empty">
              {{ label }}
            </div>
          </div>
          <Chevron class="chevron" />
        </div>
      </template>
      <template #content="{ close }">
        <div class="options-content">
          <Input
            v-if="!hideSearch"
            ref="inputRef"
            @keydown="(event) => handleKeyDown(event, close)"
            :value="query"
            size="small"
            :on-change="(val) => (query = val)"
            type="text"
            :placeholder="'Find an option'"
          />
          <div
            v-if="!filteredChoices?.length && !allowCreate"
            class="px-1 py-1"
          >
            No options found.
          </div>
          <div
            v-else
            ref="optionsRef"
            tabindex="0"
            class="flex fd-column choices"
            @keydown="(event) => handleKeyDown(event, close)"
          >
            <div
              v-if="!query && allowBlank"
              @click="
                () => {
                  selectChoice(undefined);
                  close();
                }
              "
              class="w100p select-row"
              style="height: 30px"
            >
              &nbsp;
            </div>
            <div
              v-for="choice in filteredChoices"
              :key="choice.id"
              class="w100p select-row"
              :class="{
                highlighted: highlightedChoice?.id === choice.id,
              }"
              @click="
                () => {
                  selectChoice(choice as T);
                  close();
                }
              "
              role="button"
            >
              <TagButton
                :choice="choice"
                :hide-cross="true"
                :selected="selectedChoice?.id === choice.id"
              >
                <slot name="choice" :choice="choice" />
              </TagButton>
            </div>
            <!-- create new option if enabled -->
            <div
              v-if="allowCreate"
              role="button"
              tabindex="0"
              class="w100p select-row create-row"
              @click="() => handleCreate(close)"
              data-testid="singleselect-create-option"
            >
              <small v-if="!isCreating" class="pl-1"
                >➕️ Create
                <i v-if="query">{{ query }}</i>
                <slot v-else name="create">
                  <!-- TODO make this come from props -->
                  new field
                </slot>
              </small>
              <span v-else>Creating...</span>
            </div>
          </div>
        </div>
      </template>
    </Dropdown>
  </div>
</template>

<style lang="scss" scoped>
$border-radius: 10px;

/* Style adjustments to match your design */
::v-deep(input) {
  border-radius: 0 !important;
  border-left: 0 !important;
  border-right: 0 !important;
  border-top: 0 !important;
}

.selected-choice-wrap {
  overflow: hidden;

  .selected {
    border: 2px solid #000; /* Highlight selected options */
  }

  :deep(.tag-button) {
    width: 100%;
    justify-content: flex-start;
    text-align: left;
  }
}

.single-select {
  width: 100%;
}

:deep(.single-select-dropdown.w100p) {
  width: 100%;
}

.single-select-empty {
  color: $grey;
  padding-left: $space;
  font-size: 0.9rem;
}

.trigger-content {
  min-height: 20px;
}

.chevron {
  height: $space * 1.2;
  color: color.mix($dark-grey, white, 70%);
}

.select-button {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
}

.select-row {
  padding: $space-xs;
  cursor: pointer;

  :deep(.tag-button) {
    width: 100%;
    justify-content: flex-start;
    text-align: left;
    font-size: 14px;
  }

  :deep(.tag-button small) {
    font-size: 11px;
  }

  &:hover,
  &.highlighted {
    background: rgba(0, 0, 0, 0.035);
  }
}

.tag-button {
  border: 0;
  border-radius: $border-radius;
  padding: $space-xs $space;
  cursor: pointer;

  &.selected {
    border: 1px;
  }

  .close {
    width: 0.7em;
    height: 0.7em;
    position: relative;
    top: 1px;

    ::v-deep(path) {
      stroke: rgba(0, 0, 0, 0.5);
    }
  }
}

.choices {
  max-height: 250px;
  overflow-y: auto;
}

::v-deep(.dropdown-trigger) {
  &:active {
    transform: scale(1);
  }
}

.border {
  ::v-deep(.dropdown-trigger) {
    border: 1px solid rgba(0, 0, 0, 0.1);
    padding: $space-xs;
    border-radius: 5px;
  }
}
</style>
