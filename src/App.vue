<script lang="ts" setup>
import {computed, onMounted} from 'vue';
import * as THREE from 'three';
import {VRButton} from 'three/examples/jsm/webxr/VRButton.js';
import {
  NConfigProvider,
  NMessageProvider,
  NLoadingBarProvider,
  NDialogProvider,
  NNotificationProvider, useOsTheme,darkTheme
} from "naive-ui";
import type { GlobalTheme } from 'naive-ui';
import {Editor} from '@/core/Editor';
import Layout from "@/views/layout.vue";
import {useDrawingStore} from "@/store/modules/drawing";
import {useGlobalConfigStore} from "@/store/modules/globalConfig";
import {unzip} from "@/utils/common/pako";
import {connectWebSocket} from "@/hooks/useWebSocket";

//实例化编辑器
const editor = new Editor();
window.editor = editor; // 将编辑器暴露到控制台
window.THREE = THREE;
window.VRButton = VRButton;

// 图纸相关状态存储
const drawingStore = useDrawingStore();

// 全局配置相关
const globalConfigStore = useGlobalConfigStore();
const osThemeRef = useOsTheme()
const configTheme = computed(() => {
  return globalConfigStore.theme === 'osTheme' ? (osThemeRef.value === 'dark' ? darkTheme : null) : globalConfigStore.theme === 'lightTheme'? null : darkTheme;
})

onMounted(async () => {
  //初始化IndexDB
  editor.storage.init(function () {
    editor.storage.get(function (state: any) {
      if (isLoadingFromHash) return;
      if (state !== undefined) {
        editor.fromJSON(state);
      }
      const selected = editor.config.getKey('selected');
      if (selected !== undefined) {
        editor.selectByUuid(selected);
      }
    });

    // 获取图纸
    editor.storage.getDrawing(function (state: any) {
      if (state !== undefined) {
        drawingStore.setIsUploaded(true)
        drawingStore.setImgSrc(state.imgSrc);
        drawingStore.setMarkList(unzip(state.markList));
        drawingStore.setSelectedRectIndex(state.selectedRectIndex);
        drawingStore.setImgInfo(JSON.parse(state.imgInfo));
      }
    });
  });

  let isLoadingFromHash = false;
  const hash = window.location.hash;

  if (hash.slice(1, 6) === 'file=') {
    const file = hash.slice(6);
    window.$dialog.warning({
      title: window.$t("other.warning"),
      content: window.$t("core['Any unsaved data will be lost. Are you sure?']"),
      positiveText: window.$t("other.ok"),
      negativeText: window.$t("other.cancel"),
      onPositiveClick: () => {
        const loader = new THREE.FileLoader();
        loader.crossOrigin = '';
        loader.load(file, function (text) {
          editor.clear();
          editor.fromJSON(JSON.parse((text as string)));
        });
        isLoadingFromHash = true;
      },
    });
  }

  // 启动websocket连接
  connectWebSocket(import.meta.env.VITE_SOCKET_URL);
})
</script>

<template>
  <!-- 调整 naive-ui 的字重配置 -->
  <n-config-provider :theme="configTheme as GlobalTheme" :theme-overrides="{ common: { fontWeightStrong: '600' } }">
    <n-loading-bar-provider>
      <n-dialog-provider>
        <n-notification-provider placement="bottom">
          <n-message-provider>
            <Layout></Layout>
          </n-message-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<style scoped>
.n-config-provider {
  width: 100%;
  height: 100%;
}
</style>
