<script lang="ts" setup>
import {ref, provide, onMounted} from 'vue';
import * as THREE from 'three';
import {VRButton} from 'three/examples/jsm/webxr/VRButton.js';
import {
  NConfigProvider,
  darkTheme,
  GlobalTheme,
  NMessageProvider,
  NLoadingBarProvider,
  NDialogProvider,
  NNotificationProvider
} from "naive-ui";
import {Editor} from '@/core/Editor';
import Layout from "@/views/layout.vue";
import {theme as GlobalConfigTheme} from "@/config/global";
import {useDrawingStore} from "@/store/modules/drawing";
import {unzip} from "@/utils/common/pako";
import {connectWebSocket} from "@/hooks/useWebSocket";

//实例化编辑器
const editor = new Editor();
window.editor = editor; // 将编辑器暴露到控制台
window.THREE = THREE;
window.VRButton = VRButton;

// 图纸相关状态存储
const drawingStore = useDrawingStore();

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

/* 主题相关 */
const theme = GlobalConfigTheme === 'default' ? ref<null>(null) : ref<GlobalTheme>(darkTheme);
const SET_THEME = (data: string) => {
  theme.value = data === 'darkTheme' ? darkTheme : null;
  localStorage.setItem("theme", data);
}

provide("theme", GlobalConfigTheme);
provide('set_theme', SET_THEME);
</script>

<template>
  <!-- 调整 naive-ui 的字重配置 -->
  <n-config-provider :theme="theme" :theme-overrides="{ common: { fontWeightStrong: '600' } }">
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
