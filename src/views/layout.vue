<script lang="ts" setup>
import {ref, onMounted, onBeforeMount} from 'vue';
import {
  NLayout,
  NLayoutHeader,
  NLayoutSider,
  NLayoutContent,
  NLayoutFooter
} from "naive-ui";
import {useMessage, useNotification, useDialog, useLoadingBar} from 'naive-ui';
import * as Layout from './layouts';
import {useAddSignal, useRemoveSignal} from "@/hooks/useSignal";
import Toolbar from '@/components/viewport/Toolbar.vue';

//反馈组件注册至全局
window.$message = useMessage();
window.$dialog = useDialog();
window.$loadingBar = useLoadingBar();
window.$notification = useNotification();

const siderWidth = ref(300);
//当前场景类型 enum:three | cesium
const currentSceneType = ref(window.editor.config.getKey('project/currentSceneType') || "three");
const isPlaying = ref(false);

function changCurrentSceneType(type: string) {
  window.editor.config.setKey('project/currentSceneType', type)
  currentSceneType.value = type;
}

onMounted(() => {
  useAddSignal("changCurrentSceneType", changCurrentSceneType);
  useAddSignal("startPlayer", () => {
    isPlaying.value = true;
  });
  useAddSignal("stopPlayer", () => {
    isPlaying.value = false;
  });
})
</script>

<template>
  <div id="layout">
    <n-layout position="absolute">
      <n-layout-header bordered>
        <Layout.Header/>
      </n-layout-header>

      <n-layout
          v-show="!isPlaying"
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
            collapsed-trigger-style="left:0;right:auto;transform: rotate(0deg);"
            bordered
        >
          <Layout.Assets/>
        </n-layout-sider>

        <n-layout-content>
          <Toolbar/>

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

      <n-layout-content v-show="isPlaying" class="n-layout-center-layout" position="absolute">
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
      height: 2.1rem;
      line-height: 2.1rem;
      display: flex;
      padding: 0 1rem;
      align-items: center;
    }

    &-sider {
      z-index: 15;
    }

    &-center-layout {
      top: 2.1rem;
      bottom: 3.2rem;
      width: 100%;
      height: calc(100vh - 2.1rem - 2.2rem);
      overflow: hidden;
    }

    &-footer {
      height: 2.2rem;
      padding: 0 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  }
}
</style>
