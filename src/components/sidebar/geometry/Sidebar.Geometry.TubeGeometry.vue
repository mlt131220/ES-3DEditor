<script setup lang="ts">
import {ref,reactive, onMounted} from "vue";
import {TubeGeometry} from "three";
import {t} from "@/language";
import {SetGeometryCommand} from '@/core/commands/Commands';
import EsInputNumber from "@/components/es/EsInputNumber.vue";
import * as THREE from "three";

let objectData = reactive({
  path:{
    points:[],
    curveType:"centripetal",
    tension:0.50
  },
  radius:1.00,
  tubularSegments:64,
  radialSegments:8,
  closed:false
})

const curveTypeOptions = ref([
  {label: "centripetal", value: "centripetal"},
  {label: "chordal", value: "chordal"},
  {label: "catmullrom", value: "catmullrom"}
])

onMounted(() => {
  const geometry = window.editor.selected.geometry;
  const parameters = geometry.parameters;
  Object.keys(parameters).forEach(key => {
    objectData[key] = parameters[key]
  })
})

function update() {
  window.editor.execute(new SetGeometryCommand(window.editor.selected, new TubeGeometry(
      new THREE.CatmullRomCurve3(objectData.path.points, objectData.closed, objectData.path.curveType, objectData.path.tension),
      objectData.tubularSegments,
      objectData.radius,
      objectData.radialSegments,
      objectData.closed,
  )))
}
</script>

<template>
  <div>
    <n-divider/>

    <!--  points  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene.Path") }}</span>

        <!--  TODO  UIPoints3 objectData.path.points   -->
    </div>

    <!--  radius  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene.Radius") }}</span>

      <EsInputNumber v-model:value="objectData.radius" class="!w-90px" size="small" :decimal="2"
                     :show-button="false" @change="update()"/>
    </div>

    <!--  tubularSegments  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Tubular segments']") }}</span>

      <EsInputNumber v-model:value="objectData.tubularSegments" class="!w-90px" size="small" :decimal="0"
                     :show-button="false" @change="update()"/>
    </div>

    <!--  radialSegments  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Radial segments']") }}</span>

      <EsInputNumber v-model:value="objectData.radialSegments" class="!w-90px" size="small" :decimal="0"
                     :show-button="false" @change="update()"/>
    </div>

    <!--  closed  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene.Closed") }}</span>

      <n-checkbox size="small" v-model:checked="objectData.closed" @update:checked="update" />
    </div>

    <!--  curveType  -->
    <div class="sider-scene-geometry-item">
      <span>{{ t("layout.sider.scene['Curve type']") }}</span>

      <n-select size="small" v-model:value="objectData.path.curveType" :options="curveTypeOptions" @update:value="update"/>
    </div>

    <!--  tension  -->
    <div class="sider-scene-geometry-item" v-if="objectData.path.curveType === 'catmullrom'">
      <span>{{ t("layout.sider.scene.Tension") }}</span>

      <EsInputNumber v-model:value="objectData.path.tension" class="!w-90px" size="small" :decimal="2"
                     :show-button="false" @change="update"/>
    </div>
  </div>
</template>