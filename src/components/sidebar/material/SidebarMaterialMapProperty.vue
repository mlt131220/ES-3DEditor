<script lang="ts" setup>
import {ref, reactive,watch,onMounted, onUnmounted, nextTick, toRaw} from "vue";
import {useAddSignal, useDispatchSignal, useRemoveSignal} from "@/hooks/useSignal";
import {EquirectangularReflectionMapping, SRGBColorSpace,RepeatWrapping,ClampToEdgeWrapping,MirroredRepeatWrapping  } from "three";
import type {Material, BufferGeometry} from "three";
import {SettingsAdjust} from "@vicons/carbon";
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
const colorMaps = [ 'map', 'emissiveMap', 'sheenColorMap', 'specularColorMap', 'envMap' ];
let currentMaterialSlot = 0;

const intensity = ref();
const scale = ref();
const scaleX = ref();
const scaleY = ref();
const rangeMin = ref();
const rangeMax = ref();
// 纹理重复（U、V方向重复）
const repeat = reactive({
  has:false,
  wrap:RepeatWrapping,
  x: 1,
  y: 1,
});
// 纹理重复方式
const wrapOptions = [
  {label: t('layout.sider.material.Repeat wrapping'), value: RepeatWrapping },
  {label: t('layout.sider.material.Edge stretching'), value: ClampToEdgeWrapping },
  {label: t('layout.sider.material.Mirror duplication'), value: MirroredRepeatWrapping },
]

const showConfig = ref(false)
watch(() => enabled.value, () => {
  if(!enabled.value){
    showConfig.value = false;
    return;
  }

  if(repeat.has || ['aoMap','bumpMap','displacementMap','normalMap','clearcoatNormalMap','iridescenceThicknessMap'].includes(props.property)){
    showConfig.value = true;
  }
})

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

      // 贴图是否存在纹理重复属性
      if(material[props.property].repeat){
        repeat.has = true;
        repeat.wrap = material[props.property].wrapS;
        repeat.x = material[props.property].repeat.x;
        repeat.y = material[props.property].repeat.y;
      }
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
    // 修正色彩空间
    if (colorMaps.includes(props.property) && !texture.isDataTexture && texture.colorSpace !== SRGBColorSpace) {
      texture.encoding = SRGBColorSpace;
      material.needsUpdate = true;
    }
  }

  enabledDisabled.value = false;
  onChange();
}

// 纹理重复change
function onRepeatChange() {
  if(!repeat.has) return;

  if(material[props.property].repeat.x !== repeat.x || material[props.property].repeat.y !== repeat.y){
    window.editor.execute(new SetMaterialVectorCommand(object, `${props.property}.repeat`, [repeat.x, repeat.y], 0));
  }
}

// 纹理回环change
function onRepeatWrapChange() {
  if(!repeat.has) return;

  if(material[props.property].wrapS !== repeat.wrap || material[props.property].wrapT !== repeat.wrap){
    // TODO: 后面应该改用window.editor.execute命令调用，写入历史记录以回滚
    material[props.property].wrapS = repeat.wrap;
    material[props.property].wrapT = repeat.wrap;

    material[props.property].needsUpdate = true;

    useDispatchSignal("materialChanged")
  }
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

        <n-popover v-if="showConfig" trigger="hover" placement="top-start" :width="240"
                   content-style="padding: 0;">
          <template #trigger>
            <n-button quaternary circle class="ml-15px">
              <template #icon>
                <n-icon><SettingsAdjust /></n-icon>
              </template>
            </n-button>
          </template>

          <!-- repeat(纹理重复) -->
          <div class="sider-scene-material-map-property-item" v-if="repeat.has">
            <span>{{ t("layout.sider.material.repeat") }}(U, V)</span>
            <div>
              <EsInputNumber v-model:value="repeat.x" size="tiny" :show-button="false"
                             @change="onRepeatChange"/>
              <EsInputNumber v-model:value="repeat.y" size="tiny" :show-button="false"
                             @change="onRepeatChange"/>
            </div>
          </div>

          <!-- 纹理回环(重复纹理的方式) -->
          <div class="sider-scene-material-map-property-item" v-if="repeat.has">
            <span>{{ t("layout.sider.material.repetitive mode") }}</span>
            <div>
              <n-select size="small" v-model:value="repeat.wrap" :options="wrapOptions" @update:value="onRepeatWrapChange"/>
            </div>
          </div>

          <!-- aoMap(环境遮挡贴图) -->
          <div class="sider-scene-material-map-property-item" v-if="property === 'aoMap'">
            <span>{{ t("layout.sider.object.intensity") }}</span>
            <div>
              <EsInputNumber v-model:value="intensity" size="tiny" :show-button="false"
                             @change="onIntensityChange"/>
            </div>
          </div>

          <!-- displacementMap(置换贴图) | bumpMap(凹凸贴图) -->
          <div class="sider-scene-material-map-property-item"
               v-if="property === 'bumpMap' || property === 'displacementMap'">
            <span>{{ t("layout.sider.object.scale") }}</span>
            <div>
              <EsInputNumber v-model:value="scale" size="tiny" :show-button="false"
                             @change="onScaleChange"/>
            </div>
          </div>

          <!-- clearcoatNormalMap(透明法线贴图) | normalMap(法线贴图)  -->
          <div class="sider-scene-material-map-property-item"
               v-if="property === 'normalMap' || property === 'clearcoatNormalMap'">
            <span>{{ t("layout.sider.object.scale") }}(X, Y)</span>
            <div>
              <EsInputNumber v-model:value="scaleX" size="tiny" :show-button="false"
                             @change="onScaleXYChange"/>
              <EsInputNumber v-model:value="scaleY" size="tiny" :show-button="false"
                             @change="onScaleXYChange"/>
            </div>
          </div>

          <!-- iridescenceThicknessMap(彩虹色厚度贴图) -->
          <template v-if="property === 'iridescenceThicknessMap'">
            <div class="sider-scene-material-map-property-item">
              <span>min:</span>
              <div>
                <EsInputNumber v-model:value="rangeMin" size="tiny" :show-button="false" :min="0"
                               :max="Infinity" :step="10" @change="onRangeChange"/>
                <span>nm</span>
              </div>
            </div>
            <div class="sider-scene-material-map-property-item">
              <span>max:</span>
              <div>
                <EsInputNumber v-model:value="rangeMax" size="tiny" :show-button="false" :min="0"
                               :max="Infinity" :step="10" @change="onRangeChange"/>
                <span>nm</span>
              </div>
            </div>
          </template>
        </n-popover>
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
    width: 35%;
  }

  & > div {
    width: 63%;
    margin-left: 2%;
    // color: rgb(165, 164, 164);
    display: flex;
    align-items: center;

    .es-texture {
      margin-left: 8px;
    }
  }
}
</style>