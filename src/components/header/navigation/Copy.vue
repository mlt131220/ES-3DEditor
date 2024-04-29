<template>
  <n-tooltip trigger="hover">
    <template #trigger>
      <n-button text class="mr-2" :disabled="disabled || playerStore.isPlaying" @click="handleClone()">
        <template #icon>
          <n-icon size="22" class="cursor-pointer">
            <Copy />
          </n-icon>
        </template>
      </n-button>
    </template>
    {{ t("layout.header.Clone") }}
  </n-tooltip>
</template>

<script setup lang="ts">
import {onMounted, ref} from "vue";
import {Copy} from "@vicons/carbon";
import {NIcon, NTooltip} from "naive-ui";
import {t} from "@/language";
import {useAddSignal} from "@/hooks/useSignal";
import { AddObjectCommand } from '@/core/commands/AddObjectCommand';
import {usePlayerStore} from "@/store/modules/player";

const playerStore = usePlayerStore();
const disabled = ref(true);

function objectSelected(object){
  disabled.value = object === null;
}

onMounted(() => {
  useAddSignal("objectSelected",objectSelected)
})

function handleClone() {
  if (playerStore.isPlaying) {
    window.$message?.warning(window.$t("prompt.Disable when the scene is playing"))
    return;
  }

  let object = window.editor.selected;

  //避免复制相机或场景
  if (object === null || object.parent === null) return;

  object = object.clone();

  window.editor.execute(new AddObjectCommand(object));
}
</script>

<style scoped lang="less">

</style>