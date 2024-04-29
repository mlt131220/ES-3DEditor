<template>
  <n-tooltip trigger="hover">
    <template #trigger>
      <n-button text class="mr-5" :disabled="disabled || playerStore.isPlaying" @click="handleDelete()">
        <template #icon>
          <n-icon size="22" class="cursor-pointer">
            <Delete />
          </n-icon>
        </template>
      </n-button>
    </template>
    {{ t("layout.header.Delete(Del)") }}
  </n-tooltip>
</template>

<script setup lang="ts">
import {ref,onMounted} from "vue";
import {Delete} from "@vicons/carbon";
import {NIcon, NTooltip} from "naive-ui";
import {t} from "@/language";
import {RemoveObjectCommand} from "@/core/commands/RemoveObjectCommand";
import {useAddSignal} from "@/hooks/useSignal";
import {usePlayerStore} from "@/store/modules/player";

const playerStore = usePlayerStore();

const disabled = ref(true);

function objectSelected(object){
    disabled.value = object === null;
}

onMounted(() => {
  useAddSignal("objectSelected",objectSelected)
})

function handleDelete() {
  if (playerStore.isPlaying) {
    window.$message?.warning(window.$t("prompt.Disable when the scene is playing"))
    return;
  }

  const object = window.editor.selected;

  if (object !== null && object.parent !== null) {
    window.editor.execute(new RemoveObjectCommand(object));
  }
}
</script>

<style scoped lang="less">

</style>