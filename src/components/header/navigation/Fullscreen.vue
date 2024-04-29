<template>
  <div class="flex items-center mr-2">
    <n-tooltip trigger="hover" v-if="!isFullscreen">
      <template #trigger>
        <n-button text>
          <template #icon>
            <n-icon size="20" class="cursor-pointer" @click="fullscreen">
              <ExpandOutline/>
            </n-icon>
          </template>
        </n-button>
      </template>
      {{ t("layout.header.Fullscreen") }}
    </n-tooltip>

    <n-tooltip trigger="hover" v-if="isFullscreen">
      <template #trigger>
        <n-button text>
          <template #icon>
            <n-icon size="20" class="cursor-pointer" @click="fullscreen">
              <ContractOutline/>
            </n-icon>
          </template>
        </n-button>
      </template>
      {{ t("layout.header['Exit fullscreen']") }}
    </n-tooltip>
  </div>
</template>

<script setup lang="ts">
import {ref} from "vue";
import {NIcon, NTooltip} from "naive-ui";
import {ContractOutline, ExpandOutline} from "@vicons/ionicons5";
import {t} from "@/language";

const isFullscreen = ref(false);

//全屏 / 退出全屏
function fullscreen() {
  if (document.fullscreenElement === null) {
    document.documentElement.requestFullscreen();
    isFullscreen.value = true;
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
    isFullscreen.value = false;
  }

  // Safari
  //@ts-ignore
  if (document.webkitFullscreenElement === null) {
    //@ts-ignore
    document.documentElement.webkitRequestFullscreen();
    isFullscreen.value = true;
    //@ts-ignore
  } else if (document.webkitExitFullscreen) {
    //@ts-ignore
    document.webkitExitFullscreen();
    isFullscreen.value = false;
  }
}
</script>

<style scoped lang="less">

</style>