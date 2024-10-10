<script lang="ts" setup>
import {ref, onMounted, nextTick} from 'vue';
import {useRoute} from "vue-router";
import * as Layout from './layouts';
import {useDispatchSignal} from "@/hooks/useSignal";
import {useSceneInfoStore} from "@/store/modules/sceneInfo";
import {t} from "@/language";
import {fetchGetOneScene} from "@/http/api/scenes";
import EsCubeLoading from "@/components/es/EsCubeLoading.vue";

const sceneInfoStore = useSceneInfoStore();

const initLoading = ref(true);
const siderWidth = ref(300);

async function init() {
  // 获取路由参数
  const id = useRoute().params.id;
  if (id) {
    const res = await fetchGetOneScene(id);

    if (res.error !== null) {
      window.$message?.error(t("scene.Failed to get scene data"))
      return;
    }

    res.data.cesiumConfig = res.data.cesiumConfig ? JSON.parse(res.data.cesiumConfig as string) : undefined;
    sceneInfoStore.setData(res.data);

    if(res.data.coverPicture){
      sceneInfoStore.screenshot = res.data.coverPicture;
    }

    initLoading.value = false;

    await nextTick();

    getScene(res.data);
  }
}

//拉取场景
function getScene(sceneInfo) {
  // 如果创建的是空场景则无场景包
  if (!sceneInfo.zip) return;

  let notice = window.$notification.info({
    title: t("scene['Get the scene data']") + "...",
    content: t("other.Loading") + "...",
    closable: false,
  })

  window.viewer.modules.package.unpack({
    url: sceneInfo.zip,
    onSceneLoad: (sceneJson) => {
      //console.log(sceneJson)
    },
    onComplete: () => {
      window.$message?.success(t("scene['Loading completed!']"));

      useDispatchSignal("sceneLoadComplete");

      sceneInfoStore.setData(sceneInfo);

      notice.destroy();
    }
  })
  return;
}

onMounted(() => {
  init();
})
</script>

<template>
  <EsCubeLoading v-model:visible="initLoading"/>

  <div id="layout" v-if="!initLoading">
    <n-layout position="absolute">
      <n-layout-header bordered>
        <Layout.Header/>
      </n-layout-header>

      <n-layout
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
          <Layout.Scene v-show="!sceneInfoStore.isCesiumScene"></Layout.Scene>
          <Layout.Cesium v-if="sceneInfoStore.isCesiumScene"></Layout.Cesium>
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
      padding: 0 0.5rem;
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
