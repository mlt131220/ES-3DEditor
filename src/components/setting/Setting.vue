<template>
  <n-tooltip trigger="hover">
    <template #trigger>
      <n-button quaternary @click="show = true">
        <template #icon>
          <n-icon :size="24">
            <Settings />
          </n-icon>
        </template>
      </n-button>
    </template>
    {{ t("setting.Setting") }}
  </n-tooltip>

  <n-modal v-model:show="show" display-directive="show" :z-index="zIndex" class="w-100 h-40vh">
    <n-card size="small">
      <SettingTabs />
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import {ref,onMounted} from "vue";
import {Settings} from "@vicons/carbon";
import {t} from "@/language";

const show = ref(true);
const zIndex = ref<number | undefined>(-1);
onMounted(() => {
  show.value = false;
  zIndex.value = undefined;
});
</script>

<style scoped lang="less">
.n-tab-pane{
  width: 100%;

  height: 100%;
}
</style>