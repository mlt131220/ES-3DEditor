<script lang="ts" setup>
import {ref, reactive, onMounted,onBeforeUnmount, defineAsyncComponent} from "vue";
import {ReloadCircleOutline} from "@vicons/ionicons5";
import * as THREE from 'three';

import {t} from "@/language";
import {useAddSignal, useDispatchSignal,useRemoveSignal} from "@/hooks/useSignal";
import {SetGeometryValueCommand} from '@/core/commands/SetGeometryValueCommand';
import SidebarGeometryBufferGeometry from "./siderSceneGeometry/Sidebar.Geometry.BufferGeometry.vue";
import SidebarGeometryModifiers from "./siderSceneGeometry/Sidebar.Geometry.Modifiers.vue";
import {VertexNormalsHelper} from 'three/examples/jsm/helpers/VertexNormalsHelper.js';

const hasGeometry = ref(false);
const helpersShow = ref(false);
const geometryData = reactive({
  type: "",
  uuid: "",
  name: "",
  bounds: {x: 0, y: 0, z: 0}
})
let currentGeometryType: string = "";
let currentParametersComponent: any = null;

onMounted(() => {
  useAddSignal("objectSelected", build);
  useAddSignal("geometryChanged", build);
})
onBeforeUnmount(() => {
  useRemoveSignal("objectSelected", build);
  useRemoveSignal("geometryChanged", build);
})

async function build(object) {
  if (object && object.geometry) {
    const geometry = object.geometry;
    hasGeometry.value = true;
    geometryData.type = geometry.type;
    geometryData.uuid = geometry.uuid;
    geometryData.name = geometry.name;

    if (geometry.type !== "BufferGeometry" && currentGeometryType !== geometry.type) {
      currentParametersComponent = defineAsyncComponent(() => import(`@/components/sider/siderScene/siderSceneGeometry/Sidebar.Geometry.${geometry.type}.vue`));
      currentGeometryType = geometry.type;
    }

    if (geometry.boundingBox === null) geometry.computeBoundingBox();
    const boundingBox = geometry.boundingBox;
    geometryData.bounds.x = Math.floor((boundingBox.max.x - boundingBox.min.x) * 1000) / 1000;
    geometryData.bounds.y = Math.floor((boundingBox.max.y - boundingBox.min.y) * 1000) / 1000;
    geometryData.bounds.z = Math.floor((boundingBox.max.z - boundingBox.min.z) * 1000) / 1000;

    helpersShow.value = geometry.hasAttribute('normal');
  } else {
    hasGeometry.value = false;
  }
}

const update = (method: string) => {
  const object = window.editor.selected;
  if (object === null) return;

  const call = {
    uuid: () => {
      geometryData.uuid = THREE.MathUtils.generateUUID();
      window.editor.execute(new SetGeometryValueCommand(object, 'uuid', geometryData.uuid));
    },
    name: () => {
      window.editor.execute(new SetGeometryValueCommand(object, 'name', geometryData.name));
    },
    vertexNormals: () => {
      if (window.editor.helpers[object.id] === undefined) {
        window.editor.addHelper(object, new VertexNormalsHelper(object));
      } else {
        window.editor.removeHelper(object);
      }
      useDispatchSignal("sceneGraphChanged");
    }
  }

  call[method]();
}
</script>

<template>
  <!--  emphasis: 禁止使用v-if，否则内部子组件频繁卸载，当上一次selected为null时重新选择模型会因为刚挂载组件无法触发signals  -->
  <div v-show="hasGeometry">
    <!-- type -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene.type") }}</span>
      <div>{{ geometryData.type }}</div>
    </div>

    <!-- uuid -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene.uuid") }}</span>
      <div class="flex items-center">
        <n-tooltip trigger="hover">
          <template #trigger>
            <span class="uuid">{{ geometryData.uuid }}</span>
          </template>
          {{ geometryData.uuid }}
        </n-tooltip>
        <n-button quaternary circle type="warning" v-if="geometryData.uuid" @click="update('uuid')">
          <template #icon>
            <n-icon>
              <ReloadCircleOutline/>
            </n-icon>
          </template>
        </n-button>
      </div>
    </div>

    <!-- name -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene.name") }}</span>
      <div>
        <n-input v-model:value="geometryData.name" type="text" size="small" @update:value="update('name')"/>
      </div>
    </div>

    <n-divider/>

    <!-- Helpers -->
    <div class="sider-scene-geometry-item" v-if="helpersShow">
      <span></span>
      <div>
        <n-button size="small" @click="update('vertexNormals')">
          {{ t("layout.sider.scene['Afficher normales']") }}
        </n-button>
      </div>
    </div>

    <!-- parameters -->
    <div>
      <SidebarGeometryModifiers v-if="geometryData.type === 'BufferGeometry'"/>
      <Suspense v-else>
        <template #default>
          <currentParametersComponent></currentParametersComponent>
        </template>
        <template #fallback>
          <p> Loading... </p>
        </template>
      </Suspense>
    </div>

    <!-- buffer geometry -->
    <SidebarGeometryBufferGeometry />

    <n-divider/>

    <!-- bounds -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene.bounds") }}</span>
      <div class="flex flex-col text-12px">
        <span>{{ geometryData.bounds.x }}</span>
        <span>{{ geometryData.bounds.y }}</span>
        <span>{{ geometryData.bounds.z }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="less">
.sider-scene-geometry-item {
  display: flex;
  justify-content: start;
  margin: 0.4rem 0;
  align-items: center;

  & > span {
    min-width: 4rem;
    padding-left: 1rem;
  }

  & > div {
    width: 9rem;
    color: rgb(165, 164, 164);
    overflow: hidden;

    .uuid {
      width: 100%;
      white-space: nowrap;
      overflow-x: auto;
      display: inline-block;
    }
  }
}

:deep(.n-divider) {
  margin: 0.3rem 0;
}
</style>