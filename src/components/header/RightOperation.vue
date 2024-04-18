<script lang="ts" setup>
import {ref,onMounted} from 'vue';
import AutoSave from '@/components/header/AutoSave.vue';
import CodeOut from '@/components/header/CodeOut.vue';
import XR from '@/components/header/XR.vue';
import {PlayOutline, PauseOutline, ExpandOutline, ContractOutline} from '@vicons/ionicons5';
import {NIcon, NTooltip} from "naive-ui";
import {t} from "@/language";
import {usePlayerStore} from "@/store/modules/player";
import {useDispatchSignal} from "@/hooks/useSignal";

const playerState = usePlayerStore();
const isFullscreen = ref(false);
const supportXr = ref(false);

onMounted(() => {
  // 判断是否支持XR
  if (navigator.xr) {
    if ('offerSession' in navigator.xr) {
      useDispatchSignal("offerXR",'immersive-ar');
    }else{
      supportXr.value = true;
    }
  }else{
    supportXr.value = false;
  }
});

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

<template>
  <div id="rightOperation">
    <!-- 启动 -->
    <div class="flex items-center mr-2">
      <n-tooltip trigger="hover" v-if="!playerState.isPlaying">
        <template #trigger>
          <n-icon size="22" class="cursor-pointer" @click="playerState.start()">
            <play-outline/>
          </n-icon>
        </template>
        {{ t("layout.header.Play") }}
      </n-tooltip>

      <n-tooltip trigger="hover" v-else>
        <template #trigger>
          <n-icon size="22" class="cursor-pointer" @click="playerState.stop()">
            <pause-outline/>
          </n-icon>
        </template>
        {{ t("layout.header.Stop") }}
      </n-tooltip>
    </div>

    <!-- 全屏 -->
    <div class="flex items-center mr-2">
      <n-tooltip trigger="hover" v-if="!isFullscreen">
        <template #trigger>
          <n-icon size="20" class="cursor-pointer" @click="fullscreen">
            <ExpandOutline/>
          </n-icon>
        </template>
        {{ t("layout.header.Fullscreen") }}
      </n-tooltip>

      <n-tooltip trigger="hover" v-if="isFullscreen">
        <template #trigger>
          <n-icon size="20" class="cursor-pointer" @click="fullscreen">
            <ContractOutline/>
          </n-icon>
        </template>
        {{ t("layout.header['Exit fullscreen']") }}
      </n-tooltip>
    </div>

    <XR v-if="supportXr" />

    <!--自动保存-->
    <AutoSave class="mr-2" />

    <!-- 出码 -->
    <CodeOut />
  </div>
</template>

<style lang="less" scoped>
#rightOperation {
  position: absolute;
  right: 0.5rem;
  display: flex;
  align-items: center;
}
</style>