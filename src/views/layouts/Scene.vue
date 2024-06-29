<script lang="ts" setup>
import {onMounted, onBeforeUnmount, ref, nextTick} from 'vue';
import {SunnyOutline, PlanetOutline} from '@vicons/ionicons5';
import {Viewport} from '@/core/Viewport';
import ViewportInfo from '@/components/viewport/ViewportInfo.vue';
import {useAddSignal, useDispatchSignal, useRemoveSignal} from "@/hooks/useSignal";
import {useDrawingStore} from "@/store/modules/drawing";
// 窗口分割（为图纸组件）
import {Splitpanes, Pane} from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';
import Drawing from "@/components/drawing/Drawing.vue";
import Toolbar from "@/components/viewport/Toolbar.vue";
import {useDragStore} from "@/store/modules/drag";
import IFCProperties from "@/components/viewport/IFCProperties.vue";

const viewportRef = ref();
const loading = ref(false);
const loadingText = ref("");

const showBimInfo = ref(false);
const bimInfo = ref({})

//监听视窗变化（节流）
let timer: NodeJS.Timeout | null = null;

function onViewPortResize(width: number, height: number) {
  if (timer) return;
  timer = setTimeout(function () {
    useDispatchSignal("sceneResize",width,height);
    timer = null;
  }, 10)
}

// 图纸组件相关
const drawingStore = useDrawingStore();

/** 鼠标拖拽事件相关 **/
const dragStore = useDragStore();

function sceneDrop(event) {
  event.preventDefault();

  const dt = event.dataTransfer as DataTransfer;

  //拖拽大纲视图
  if (dt.types[0] === 'text/plain') return;

  if (dt.items) {
    //支持文件夹
    window.editor.loader.loadItemList(dt.items);
  } else {
    window.editor.loader.loadFiles(dt.files, undefined, () => {
    });
  }
}

function sceneDragOver(event) {
  event.preventDefault();
  (event.dataTransfer as DataTransfer).dropEffect = 'copy';
}

function sceneDragEnter() {
  dragStore.setActionTarget("addToScene");
}

function sceneDragLeave() {
  dragStore.setActionTarget("");
}

/** 鼠标拖拽事件相关 End **/
function changeLoading(bool: boolean) {
  loading.value = bool;
}

function changeLoadingText(str: string) {
  loadingText.value = str;
}

function objectSelected(object) {
  if (!object) {
    showBimInfo.value = false;
    return;
  }
  if (!object.userData.BIM) {
    if(!object.parent || !object.parent.userData.BIM) {
      showBimInfo.value = false;
    }else{
      showBimInfo.value = true;
      bimInfo.value = object.parent.userData.BIM;
    }
  } else {
    showBimInfo.value = true;
    bimInfo.value = object.userData.BIM;
  }
}

onMounted(async () => {
  new Viewport(viewportRef.value);

  await nextTick();

  const resizeObserver = new ResizeObserver(() => {
    onViewPortResize(viewportRef.value.offsetWidth, viewportRef.value.offsetHeight);
  });
  resizeObserver.observe(viewportRef.value);

  useAddSignal("switchViewportLoading",changeLoading);
  useAddSignal("changeViewportLoadingText",changeLoadingText);
  useAddSignal("objectSelected",objectSelected);
})

onBeforeUnmount(() => {
  useRemoveSignal("switchViewportLoading",changeLoading);
  useRemoveSignal("changeViewportLoadingText",changeLoadingText);
  useRemoveSignal("objectSelected",objectSelected);
})
</script>

<template>
  <n-spin :show="loading" @drop="sceneDrop" @dragover="sceneDragOver" @dragenter="sceneDragEnter"
          @dragleave="sceneDragLeave">
    <splitpanes class="h-full" @resize="onViewPortResize" @resized="onViewPortResize">
      <pane min-size="10" v-if="drawingStore.getIsUploaded">
        <Drawing />
      </pane>
      <pane min-size="10">
        <Toolbar />

        <div id="viewport" ref="viewportRef" class="absolute top-0 left-0 w-full h-full">
          <ViewportInfo />
        </div>
      </pane>
    </splitpanes>

    <!--  RVT BIM 构件信息悬浮框  -->
    <n-card v-if="showBimInfo" class="absolute top-40px right-1 max-w-300px" content-style="padding: 5px 10px;">
      <n-collapse accordion default-expanded-names="bim">
        <template #arrow="{collapsed}">
          <n-icon v-if="collapsed">
            <PlanetOutline/>
          </n-icon>
          <n-icon v-else>
            <SunnyOutline/>
          </n-icon>
        </template>

        <n-collapse-item title="&nbsp;BIM 构件信息" name="bim">
          <div class="max-h-360px overflow-y-auto">
            <n-descriptions v-for="(item, index) in bimInfo.parameters" :key="index"
                            label-placement="left" bordered size="small" :column="1">
              <template #header>
                <p class="py-2">{{ item.GroupName }}</p>
              </template>
              <n-descriptions-item v-for="(it, i) in item.Parameters" :key="i + it.name" :label="it.name">
                {{ it.value }}
              </n-descriptions-item>
            </n-descriptions>
          </div>
        </n-collapse-item>
      </n-collapse>
    </n-card>

    <!-- IFC BIM 构件信息悬浮框   -->
    <IFCProperties></IFCProperties>

    <template #description>{{ loadingText }}</template>
  </n-spin>
</template>

<style lang="less" scoped>
.n-spin-container {
  width: 100%;
  height: 100%;
  overflow: hidden;

  :deep(.n-spin-content) {
    width: 100%;
    height: 100%;

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

    .n-descriptions{
      &-header{
        margin-bottom: 0;
      }
    }
  }
}
</style>
