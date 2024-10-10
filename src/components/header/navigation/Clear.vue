<template>
  <n-tooltip trigger="hover">
    <template #trigger>
      <n-button text class="mr-5" :disabled="disabled" @click="handleClear">
        <template #icon>
          <n-icon size="22" class="cursor-pointer">
            <PaintBrush />
          </n-icon>
        </template>
      </n-button>
    </template>
    {{ t("layout.header.Clear Out") }}
  </n-tooltip>
</template>

<script setup lang="ts">
import {ref,onMounted} from "vue";
import {PaintBrush} from "@vicons/carbon";
import {NIcon, NTooltip} from "naive-ui";
import {t} from "@/language";
import {useSceneInfoStore} from "@/store/modules/sceneInfo";

const sceneInfoStore = useSceneInfoStore();

const disabled = ref(false);

onMounted(() => {})

function handleClear() {
  window.$dialog.warning({
    title: window.$t('other.warning'),
    content: window.$t("core['Any unsaved data will be lost. Are you sure?']"),
    positiveText: window.$t('other.ok'),
    negativeText: window.$t('other.cancel'),
    onPositiveClick: () => {
      if (sceneInfoStore.isCesiumScene) {
        window.CesiumApp.reset();
        //useDispatchSignal("cesium_destroy");
      }else{
        window.editor.reset()
      }
    },
  });
}
</script>

<style scoped lang="less">

</style>