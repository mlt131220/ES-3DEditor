<script lang="ts" setup>
import {computed, onMounted} from 'vue';
import * as THREE from 'three';
import {VRButton} from 'three/examples/jsm/webxr/VRButton.js';
import {GlobalThemeOverrides} from "naive-ui";
import {Editor} from '@/core/Editor';
import {useGlobalConfigStore} from "@/store/modules/globalConfig";
import {connectWebSocket} from "@/hooks/useWebSocket";
import Index from "@/views/index.vue";

//实例化编辑器
const editor = new Editor();
window.editor = editor; // 将编辑器暴露到控制台
window.VRButton = VRButton;

// 全局配置相关
const globalConfigStore = useGlobalConfigStore();

const themeOverrides = computed<GlobalThemeOverrides>(() => {
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
      },
    });
  }

  // 启动websocket连接
  connectWebSocket(import.meta.env.VITE_GLOB_SOCKET_URL);
})
</script>

<template>
  <!-- 调整 naive-ui 的字重配置 -->
  <n-config-provider :theme="globalConfigStore.getProviderTheme()" :theme-overrides="themeOverrides">
    <n-loading-bar-provider>
      <n-dialog-provider>
        <n-modal-provider>
          <n-notification-provider placement="bottom">
            <n-message-provider>
              <Index/>
            </n-message-provider>
          </n-notification-provider>
        </n-modal-provider>
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
