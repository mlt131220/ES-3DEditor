<template>
  <n-tooltip trigger="hover">
    <template #trigger>
      <n-button text class="mr-2" :disabled="undoDisabled" @click="handleUndo()">
        <template #icon>
          <n-icon size="22" class="cursor-pointer">
            <Undo />
          </n-icon>
        </template>
      </n-button>
    </template>
    {{ t("layout.header.Undo(Ctrl+Z)") }}
  </n-tooltip>

  <n-tooltip trigger="hover">
    <template #trigger>
      <n-button text class="mr-5" :disabled="redoDisabled" @click="handleRedo()">
        <template #icon>
          <n-icon size="22" class="cursor-pointer">
            <Redo />
          </n-icon>
        </template>
      </n-button>
    </template>
    {{ t("layout.header.Redo(Ctrl+Y)") }}
  </n-tooltip>
</template>

<script setup lang="ts">
import {onMounted, ref} from "vue";
import {NIcon, NTooltip} from "naive-ui";
import {Undo,Redo} from "@vicons/carbon";
import {t} from "@/language";
import {useAddSignal} from "@/hooks/useSignal";

const undoDisabled = ref(true);
const redoDisabled = ref(true);

function historyChanged() {
  undoDisabled.value = window.editor.history.undos.length === 0;
  redoDisabled.value = window.editor.history.redos.length === 0;
}

onMounted(() => {
  useAddSignal("historyChanged", historyChanged);

  historyChanged();
})

//撤销
function handleUndo() {
  window.editor.undo();
}

//重做
function handleRedo() {
  window.editor.redo();
}
</script>

<style scoped lang="less">

</style>