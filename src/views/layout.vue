<script lang="ts" setup>
import {ref, onMounted} from 'vue';
import {
  NLayout,
  NLayoutHeader,
  NLayoutSider,
  NLayoutContent,
  NLayoutFooter
} from "naive-ui";
import * as Layout from './layouts';
import {useAddSignal} from "@/hooks/useSignal";
import {useSceneInfoStore} from "@/store/modules/sceneInfo";
import {usePlayerStore} from "@/store/modules/player";

const sceneInfoStore = useSceneInfoStore();
const playerState = usePlayerStore();

const siderWidth = ref(300);
//当前场景类型 enum:three | cesium
const currentSceneType = ref(sceneInfoStore.getIsCesium ? 'cesium' : "three");

function changCurrentSceneType(type: string) {
  sceneInfoStore.setIsCesium(type === 'cesium');

  currentSceneType.value = type;
}

onMounted(() => {
  useAddSignal("changCurrentSceneType", changCurrentSceneType);
})
</script>

<template>
  <div id="layout">
    <n-layout position="absolute">
      <n-layout-header bordered>
        <Layout.Header/>
      </n-layout-header>

      <n-layout
          v-show="!playerState.isPlaying"
          class="n-layout-center-layout"
          has-sider
          sider-placement="right"
          position="absolute"
      >
        <n-layout-sider
            collapse-mode="width"
            :collapsed-width="0"
            :width="siderWidth"
            :native-scrollbar="false"
            show-trigger="bar"
            trigger-style="right:0;left:auto;transform: translateX(28px);"
            collapsed-trigger-style="left:0;right:auto;transform: rotate(0deg);">
          <Layout.Assets/>
        </n-layout-sider>

        <n-layout-content>
          <Layout.Scene v-show="currentSceneType === 'three'"></Layout.Scene>
          <Layout.Cesium v-if="currentSceneType === 'cesium'"></Layout.Cesium>
        </n-layout-content>

        <n-layout-sider
            collapse-mode="transform"
            :collapsed-width="0"
            :width="siderWidth"
            :native-scrollbar="false"
            show-trigger="bar"
            bordered
        >
          <Layout.Sider/>
        </n-layout-sider>
      </n-layout>

      <n-layout-content v-show="playerState.isPlaying" class="n-layout-center-layout" position="absolute">
        <div id="player" class="w-full h-full"></div>
      </n-layout-content>

      <n-layout-footer bordered position="absolute">
        <Layout.Footer/>
      </n-layout-footer>
    </n-layout>
  </div>
</template>

<style lang="less" scoped>
#layout {
  width: 100%;
  height: 100%;
  position: relative;

  .n-layout {
    &-header {
      height: var(--header-height);
      line-height: var(--header-height);
      padding: 0 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    &-sider {
      z-index: 15;
      height: 100%;
    }

    &-center-layout {
      top: var(--header-height);
      bottom: var(--footer-height);
      width: 100%;
      height: calc(100vh - var(--header-height) - var(--footer-height));
      overflow: hidden;
    }

    &-footer {
      height: var(--footer-height);
      padding: 0 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  }
}
</style>
