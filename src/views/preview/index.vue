<template>
  <EsCubeLoading v-model:visible="initLoading"/>

  <div id="preview" class="w-full h-full">
    <splitpanes class="w-full h-full" @resize="onViewPortResize" @resized="onViewPortResize">
      <pane min-size="10" v-if="drawingStore.getIsUploaded">
        <Drawing />
      </pane>
      <pane min-size="10">
        <div ref="viewportRef" class="relative w-full h-full">
          <PreviewSceneTree />

          <PreviewOperations />
        </div>
      </pane>
    </splitpanes>
  </div>
</template>

<script setup lang="ts">
import {nextTick, onMounted, ref} from "vue";
import { useRoute } from 'vue-router';
import {Pane, Splitpanes} from "splitpanes";
import 'splitpanes/dist/splitpanes.css';
import {t} from "@/language";
import {fetchGetOneScene} from "@/http/api/scenes";
import {useDispatchSignal} from "@/hooks/useSignal";
import {Viewport} from "@/core/preview/Viewport";
import {useSceneInfoStore} from "@/store/modules/sceneInfo";
import {usePreviewOperationStore} from "@/store/modules/previewOperation";
import {useDrawingStore} from "@/store/modules/drawing";
import EsCubeLoading from "@/components/es/EsCubeLoading.vue";
import PreviewSceneTree from "@/views/preview/components/PreviewSceneTree.vue";
import PreviewOperations from "@/views/preview/components/Operations.vue";
import Drawing from "@/components/drawing/Drawing.vue";

const route = useRoute();
const sceneInfoStore = useSceneInfoStore();
const operationStore = usePreviewOperationStore();
// 图纸组件相关
const drawingStore = useDrawingStore();

const viewportRef = ref();
const initLoading = ref(true);

onMounted(async () => {
  window.viewer = new Viewport(viewportRef.value);

  await nextTick();

  //监听视窗变化（节流）
  let timer: NodeJS.Timeout | null = null;
  const resizeObserver = new ResizeObserver(() => {
    if (timer) return;
    timer = setTimeout(() => {
      useDispatchSignal("sceneResize",viewportRef.value.offsetWidth, viewportRef.value.offsetHeight);
      timer = null;
    }, 16)
  });
  resizeObserver.observe(viewportRef.value);

  await init();
});

async function init(){
  // 获取路由参数
  const id = route.params.id as string;
  if(!id){
    window.$message?.error(t("prompt['Parameter error!']"));
    return;
  }

  const res = await fetchGetOneScene(id);
  if (res.error !== null) {
    window.$message?.error(t("scene.Failed to get scene data"))
    return;
  }

  res.data.cesiumConfig = res.data.cesiumConfig ? JSON.parse(res.data.cesiumConfig as string) : undefined;
  sceneInfoStore.setData(res.data);

  initLoading.value = false;

  getScene(res.data);
}

//拉取场景
function getScene(sceneInfo){
  // 如果创建的是空场景则无场景包
  if (!sceneInfo.zip) return;

  let notice = window.$notification.info({
    title: window.$t("scene['Get the scene data']") + "...",
    content: window.$t("other.Loading") + "...",
    closable: false,
  })

  window.viewer.modules.package.unpack({
    url: sceneInfo.zip,
    onSceneLoad: (sceneJson:ISceneJson,fromJSONResult:IFromJSONResult) => {
      window.viewer.load(sceneJson);

      window.viewer.modules.operation.initCamera = fromJSONResult.initCamera;
    },
    onComplete: () => {
      // 加载完成后，生成Collider环境
      window.viewer.modules.roaming.generateColliderEnvironment().then(()=>{
        // 检查人物模型是否已加载
        const checkPlayer = () => {
          if(window.viewer.modules.roaming.person !== undefined){
            operationStore.menuList.roaming.loading = false;
          }else{
            setTimeout(()=>{
              checkPlayer();
            },200)
          }
        }

        checkPlayer();
      });

      window.$message?.success(t("scene['Loading completed!']"));

      useDispatchSignal("sceneLoadComplete");

      window.viewer.setup();

      sceneInfoStore.setData(sceneInfo);

      notice.destroy();
    }
  })
  return;
}

//监听视窗变化（节流）
let timer: NodeJS.Timeout | null = null;
function onViewPortResize(width: number, height: number) {
  if (timer) return;
  timer = setTimeout(function () {
    useDispatchSignal("sceneResize",width,height);
    timer = null;
  }, 10)
}
</script>

<style scoped lang="less">
.splitpanes {
  &__pane {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  &__splitter {
    background-color: #ccc;
    position: relative;

    &:before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      transition: opacity 0.4s;
      background-color: rgba(255, 0, 0, 0.3);
      opacity: 0;
      z-index: 1;
    }

    &:hover:before {
      opacity: 1;
    }
  }

  &--vertical > .splitpanes__splitter:before {
    left: -15px;
    right: -15px;
    height: 100%;
  }
}
</style>