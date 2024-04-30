<script lang="ts" setup>
import {computed, onMounted, provide} from 'vue';
import * as THREE from 'three';
import {VRButton} from 'three/examples/jsm/webxr/VRButton.js';
import {
  NConfigProvider,
  NMessageProvider,
  NLoadingBarProvider,
  NDialogProvider,
  NNotificationProvider,GlobalThemeOverrides
} from "naive-ui";
import {Editor} from '@/core/Editor';
import {useDrawingStore} from "@/store/modules/drawing";
import {useGlobalConfigStore} from "@/store/modules/globalConfig";
import {unzip} from "@/utils/common/pako";
import {connectWebSocket} from "@/hooks/useWebSocket";
import Index from "@/views/index.vue";

//实例化编辑器
const editor = new Editor();
window.editor = editor; // 将编辑器暴露到控制台
window.VRButton = VRButton;

// 图纸相关状态存储
const drawingStore = useDrawingStore();

// 全局配置相关
const globalConfigStore = useGlobalConfigStore();

const themeOverrides= computed<GlobalThemeOverrides>(() => {
  const mainColor = globalConfigStore.mainColor as IConfig.Color;

  return {
    common: {
      primaryColor: mainColor.hex,
      primaryColorHover: mainColor.hexHover,
      primaryColorPressed: mainColor.hexPressed,
      primaryColorSuppl: mainColor.hexSuppl,
      successColor: mainColor.hex,
      successColorHover: mainColor.hexHover,
      successColorPressed: mainColor.hexPressed,
      successColorSuppl: mainColor.hexSuppl,
      fontWeightStrong: '600'
    }
  }
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
  <n-config-provider :theme="globalConfigStore.getProviderTheme()" :theme-overrides="themeOverrides">
    <n-loading-bar-provider>
      <n-dialog-provider>
        <n-notification-provider placement="bottom">
          <n-message-provider>
            <Index />
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
