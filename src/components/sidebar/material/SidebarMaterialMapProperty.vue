<script lang="ts" setup>
import {inject, ref, onMounted, onUnmounted, nextTick, toRaw} from "vue";
import {useAddSignal, useRemoveSignal} from "@/hooks/useSignal";
import type {Material, BufferGeometry} from "three";
import {EquirectangularReflectionMapping, sRGBEncoding} from "three";
import {SetMaterialMapCommand} from '@/core/commands/SetMaterialMapCommand';
import {SetMaterialValueCommand} from '@/core/commands/SetMaterialValueCommand';
import {SetMaterialVectorCommand} from '@/core/commands/SetMaterialVectorCommand';
import {SetMaterialRangeCommand} from '@/core/commands/SetMaterialRangeCommand';
import EsInputNumber from '@/components/es/EsInputNumber.vue';
import EsTexture from '@/components/es/EsTexture.vue';
import {t} from "@/language";

const props = withDefaults(defineProps<{
  property: string,
  name: string
}>(), {
  property: "",
  name: ""
})

const show = ref(false);
const enabled = ref(false);
const enabledDisabled = ref(false);
const texture: any = ref(null);
const esTextureRef = ref();
let object: { material: Material, geometry: BufferGeometry };
let material: Material;
let mapType;
let currentMaterialSlot = 0;
const intensity = ref();
const scale = ref();
const scaleX = ref();
const scaleY = ref();
const rangeMin = ref();
const rangeMax = ref();

onMounted(() => {
  useAddSignal("objectSelected", handleObjectSelected);
  useAddSignal("materialChanged", update);
  useAddSignal("materialCurrentSlotChange", currentSlotChange);

  mapType = props.property.replace('Map', '');
})

onUnmounted(() => {
  useRemoveSignal("objectSelected", handleObjectSelected);
  useRemoveSignal("materialChanged", update);
  useRemoveSignal("materialCurrentSlotChange", currentSlotChange)
})

function currentSlotChange(currentSlot) {
  currentMaterialSlot = currentSlot;
  update();
}

function handleObjectSelected(selected) {
  object = selected;
  texture.value = null;
  esTextureRef.value?.setValue(null);
  update();
}

async function update() {
  if (object === null || object.material === undefined) return;

  material = window.editor.getObjectMaterial(object, currentMaterialSlot);

  if (props.property in material) {
    if (material[props.property] !== null) {
      texture.value = material[props.property];
    }

    enabled.value = material[props.property] !== null;
    enabledDisabled.value = toRaw(texture.value) === null;

    if (intensity.value !== undefined) {
      intensity.value = material[`${props.property}Intensity`];
    }

    if (scale.value !== undefined) {
      scale.value = material[`${mapType}Scale`];
    }

    if (scaleX.value !== undefined) {
      scaleX.value = material[`${mapType}Scale`]?.x;
      scaleY.value = material[`${mapType}Scale`]?.y;
    }

    if (rangeMin.value !== undefined) {
      rangeMin.value = material[`${mapType}Range`][0];
      rangeMax.value = material[`${mapType}Range`][1];
    }

    show.value = true;

    await nextTick();
    // 添加 material[props.property] !== null，以防取消贴图时变上传按钮，原贴图缩略图消失
    material[props.property] !== null && esTextureRef.value?.setValue(material[props.property]);
  } else {
    show.value = false;
  }
}

// 复选框change
function onChange() {
  const newMap: any = enabled.value ? toRaw(texture.value) : null;

  if (material[props.property] !== newMap) {
    if (newMap !== null) {
      if (!object.geometry.hasAttribute('uv')) console.error('Geometry 没有UV:', object.geometry);
      if (props.property === 'envMap') newMap.mapping = EquirectangularReflectionMapping;
    }

    window.editor.execute(new SetMaterialMapCommand(object, props.property, newMap, currentMaterialSlot));
  }
}

// 贴图change
function onMapChange(texture) {
  if (texture !== null) {
    if (texture.isDataTexture !== true && texture.encoding !== sRGBEncoding) {
      texture.encoding = sRGBEncoding;
      material.needsUpdate = true;
    }
  }

  enabledDisabled.value = false;
  onChange();
}

function onIntensityChange() {
  if (material[`${props.property}Intensity`] !== intensity.value) {
    window.editor.execute(new SetMaterialValueCommand(object, `${props.property}Intensity`, intensity.value, 0));
  }
}

function onScaleChange() {
  if (material[`${mapType}Scale`] !== scale.value) {
    window.editor.execute(new SetMaterialValueCommand(object, `${mapType}Scale`, scale.value, 0));
  }
}

function onScaleXYChange() {
  const value = [scaleX.value, scaleY.value];

  if (material[`${mapType}Scale`].x !== value[0] || material[`${mapType}Scale`].y !== value[1]) {
    window.editor.execute(new SetMaterialVectorCommand(object, `${mapType}Scale`, value, 0));
  }
}

function onRangeChange() {
  const value = [rangeMin.value, rangeMax.value];

  if (material[`${mapType}Range`][0] !== value[0] || material[`${mapType}Range`][1] !== value[1]) {
    window.editor.execute(new SetMaterialRangeCommand(object, `${mapType}Range`, value[0], value[1], 0));
  }
}
</script>

<template>
  <div class="sider-scene-material-map-property" v-if="show">
    <div class="sider-scene-material-map-property-item">
      <span>{{ t(`layout.sider.material.${name}`) }}</span>
      <div>
        <n-checkbox size="small" v-model:checked="enabled" :disabled="enabledDisabled"
                    @update:checked="onChange"/>
        <EsTexture ref="esTextureRef" v-model:texture="texture" @change="onMapChange"/>
      </div>
    </div>

    <!-- aoMap -->
    <div class="sider-scene-material-map-property-item" v-if="property === 'aoMap'">
      <span></span>
      <div>
        <EsInputNumber v-model:value="intensity" size="tiny" :show-button="false" :bordered="false"
                       @change="onIntensityChange"/>
      </div>
    </div>

    <!-- displacementMap | bumpMap -->
    <div class="sider-scene-material-map-property-item"
         v-if="property === 'bumpMap' || property === 'displacementMap'">
      <span></span>
      <div>
        <EsInputNumber v-model:value="scale" size="tiny" :show-button="false" :bordered="false"
                       @change="onScaleChange"/>
      </div>
    </div>

    <!-- clearcoatNormalMap | normalMap  -->
    <div class="sider-scene-material-map-property-item"
         v-if="property === 'normalMap' || property === 'clearcoatNormalMap'">
      <span></span>
      <div>
        <EsInputNumber v-model:value="scaleX" size="tiny" :show-button="false" :bordered="false"
                       @change="onScaleXYChange"/>
        <EsInputNumber v-model:value="scaleY" size="tiny" :show-button="false" :bordered="false"
                       @change="onScaleXYChange"/>
      </div>
    </div>

    <!-- iridescenceThicknessMap -->
    <div class="sider-scene-material-map-property-item" v-if="property === 'iridescenceThicknessMap'">
      <span>min:</span>
      <div>
        <EsInputNumber v-model:value="rangeMin" size="tiny" :show-button="false" :bordered="false" :min="0"
                       :max="Infinity" :step="10" @change="onRangeChange"/>
        <span>nm</span>
      </div>
    </div>
    <div class="sider-scene-material-map-property-item" v-if="property === 'iridescenceThicknessMap'">
      <span>max:</span>
      <div>
        <EsInputNumber v-model:value="rangeMax" size="tiny" :show-button="false" :bordered="false" :min="0"
                       :max="Infinity" :step="10" @change="onRangeChange"/>
        <span>nm</span>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.sider-scene-material-map-property-item {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
  align-items: center;

  & > span {
    min-width: 80px;
  }

  & > div {
    width: 150px;
    // color: rgb(165, 164, 164);
    display: flex;
    align-items: center;

    .es-texture {
      margin-left: 0.5rem;
    }
  }
}
</style>