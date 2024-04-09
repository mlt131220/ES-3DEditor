<script setup lang="ts">
import {reactive, onMounted} from "vue";
import { TeapotGeometry } from '@/core/geometries/TeapotGeometry.js';
import {t} from "@/language";
import {SetGeometryCommand} from '@/core/commands/Commands';
import EsInputNumber from "@/components/es/EsInputNumber.vue";
import {useDispatchSignal} from "@/hooks/useSignal";

let objectData = reactive({
  size: 2.00,
  segments: 10,
  bottom:true,
  lid:true,
  body:true,
  fitLid:false,
  blinn:true,
})

onMounted(() => {
  const geometry = window.editor.selected.geometry;
  const parameters = geometry.parameters;
  Object.keys(parameters).forEach(key => {
    objectData[key] = parameters[key]
  })
})

function update() {
  const geometry = window.editor.selected?.geometry;
  geometry?.dispose();

  window.editor.execute(new SetGeometryCommand(window.editor.selected, new TeapotGeometry(
      objectData.size,
      objectData.segments,
      objectData.bottom,
      objectData.lid,
      objectData.body,
      objectData.fitLid,
      objectData.blinn
  )))

  geometry?.computeBoundingSphere();

  useDispatchSignal("geometryChanged",window.editor.selected)
}
</script>

<template>
  <div>
    <n-divider/>

    <!--  size  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene.Size") }}</span>

      <EsInputNumber v-model:value="objectData.size" class="!w-90px" size="small" :decimal="2"
                     :show-button="false" @change="update()"/>
    </div>

    <!--  segments  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene.Segments") }}</span>

      <EsInputNumber v-model:value="objectData.segments" class="!w-90px" size="small" :decimal="0" :min="1"
                     :show-button="false" @change="update()"/>
    </div>

    <!--  bottom  -->
    <div class="sider-scene-geometry-item">
      <span>Bottom</span>

      <n-checkbox size="small" v-model:checked="objectData.bottom" @update:checked="update" />
    </div>

    <!--  lid  -->
    <div class="sider-scene-geometry-item">
      <span>Lid</span>

      <n-checkbox size="small" v-model:checked="objectData.lid" @update:checked="update" />
    </div>

    <!--  body  -->
    <div class="sider-scene-geometry-item">
      <span>Body</span>

      <n-checkbox size="small" v-model:checked="objectData.body" @update:checked="update" />
    </div>

    <!--  fitted lid  -->
    <div class="sider-scene-geometry-item">
      <span>Fitted Lid</span>

      <n-checkbox size="small" v-model:checked="objectData.fitLid" @update:checked="update" />
    </div>

    <!--  blinn-sized  -->
    <div class="sider-scene-geometry-item">
      <span>Blinn-scaled</span>

      <n-checkbox size="small" v-model:checked="objectData.blinn" @update:checked="update" />
    </div>
  </div>
</template>