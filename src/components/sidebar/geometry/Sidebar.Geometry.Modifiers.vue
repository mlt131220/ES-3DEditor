<script lang="ts" setup>
import {useDispatchSignal} from "@/hooks/useSignal";
import {t} from "@/language";

//计算顶点法线
function computeVertexNormals() {
  const object = window.editor.selected;
  const geometry = object.geometry;
  geometry.computeVertexNormals();
  useDispatchSignal("geometryChanged", object);
}

//居中
function centerGeometry() {
  const object = window.editor.selected;
  const geometry = object.geometry;
  geometry.center();
  useDispatchSignal("geometryChanged", object);
}
</script>

<template>
  <!-- Compute Vertex Normals -->
  <div class="sider-scene-geometry-item">
    <span></span>
    <div>
      <n-button size="small" @click="computeVertexNormals">{{ t("layout.sider.geometry['Compute Vertex Normals']") }}
      </n-button>
    </div>
  </div>
  <!-- Center Geometry -->
  <div class="sider-scene-geometry-item">
    <span></span>
    <div>
      <n-button size="small" @click="centerGeometry">{{ t("layout.sider.scene.Center") }}</n-button>
    </div>
  </div>
</template>