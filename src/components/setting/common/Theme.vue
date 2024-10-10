<template>
  <n-tooltip trigger="hover">
    <template #trigger>
      <n-button quaternary @click="globalConfigStore.setTheme()" class="mr-1">
        <template #icon>
          <n-icon>
            <component :is="component"/>
          </n-icon>
        </template>
      </n-button>
    </template>
    {{ tooltip }}
  </n-tooltip>
</template>

<script setup lang="ts">
import {computed,ref} from "vue";
import {Contrast, LightFilled, AsleepFilled} from "@vicons/carbon";
import {useGlobalConfigStore} from "@/store/modules/globalConfig";
import {t} from "@/language";

const globalConfigStore = useGlobalConfigStore();
const tooltip = ref(t("layout.header['Use system theme']"));

const component = computed(() => {
  switch (globalConfigStore.theme) {
    case "osTheme":
      tooltip.value = t("layout.header['Use system theme']");
      return Contrast;
    case "lightTheme":
      tooltip.value = t('layout.header.Undertint');
      return LightFilled;
    case "darkTheme":
      tooltip.value = t('layout.header.Dark');
      return AsleepFilled;
  }
})
</script>

<style scoped lang="less">

</style>