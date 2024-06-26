<template>
  <n-form label-placement="left" :label-width="90" label-align="left" size="small">
    <!-- background -->
    <n-form-item :label="t('layout.sider.sceneConfig.Background')">
      <template class="w-full flex items-center justify-between">
        <n-select v-model:value="backgroundType" @update:value="onBackgroundChanged"
                  :options="[{ label: '', value: 'None' }, { label: 'Color', value: 'Color' }, { label: 'Texture', value: 'Texture' }, { label: 'Equirect', value: 'Equirectangular' }]"/>

        <n-color-picker v-if="backgroundType === 'Color'" v-model:value="backgroundColor" :show-alpha="false" :render-label="() => ''"
                        :modes="['hex']" @update:value="onBackgroundChanged" size="small"  class="ml-5px w-36px"/>

        <EsTexture v-else-if="backgroundType === 'Texture'" v-model:texture="backgroundTexture"
                   @change="onBackgroundChanged" width="26px" height="26px" class="ml-5px"/>

        <EsTexture v-else-if="backgroundType === 'Equirectangular'" v-model:texture="backgroundEquirectangularTexture"
                   @change="onBackgroundChanged" width="26px" height="26px" class="ml-5px" />
      </template>
    </n-form-item>
    <div v-if="backgroundType === 'Equirectangular'" class="flex justify-start items-center pl-90px pb-1">
      <EsInputNumber v-model:value="backgroundBlurriness" class="w-30% ml-5px"
                     size="tiny" :show-button="false" :min="0" :max="1" :decimal="2"
                     @change="onBackgroundChanged" />
      <EsInputNumber v-model:value="backgroundIntensity" class="w-30% ml-5px"
                     size="tiny" :show-button="false" :min="0" :max="Infinity" :decimal="2"
                     @change="onBackgroundChanged" />
      <EsInputNumber v-model:value="backgroundRotation" class="w-30% ml-5px"
                     size="tiny" :show-button="false" :min="-180" :max="180" :decimal="1" unit="°"
                     @change="onBackgroundChanged" />
    </div>

    <!-- environment -->
    <n-form-item :label="t('layout.sider.sceneConfig.Environment')">
      <n-select v-model:value="environmentSelect" @update:value="onEnvironmentChanged"
                :options="[{ label: '', value: 'None' }, { label: 'Equirect', value: 'Equirectangular' }, { label: 'Modelviewer', value: 'ModelViewer' }]"/>

      <EsTexture v-if="environmentSelect === 'Equirectangular'" v-model:texture="environmentTexture"
                 @change="onEnvironmentChanged" width="26px" height="26px" class="ml-5px"/>
    </n-form-item>

    <!-- fog -->
    <n-form-item :label="t('layout.sider.sceneConfig.Fog')">
      <n-select v-model:value="fogSelect" @update:value="onFogChanged"
                :options="[{ label: '', value: 'None' }, { label: 'Linear', value: 'Fog' }, { label: 'Exponential', value: 'FogExp2' }]"/>
    </n-form-item>
    <div class="flex justify-start items-center pl-90px pb-1" v-if="fogSelect !== 'None'">
      <!-- fog color -->
      <n-color-picker v-model:value="fogColor" :show-alpha="false" :modes="['hex']" size="small"
                      @update:value="onFogSettingsChanged" :render-label="() => ''" class="w-45%" />
      <!-- fog near -->
      <EsInputNumber v-if="fogSelect === 'Fog'" v-model:value="fogNear" size="tiny" :show-button="false"
                     class="w-30% ml-5px"
                     :min="0" :max="Infinity" :decimal="2" @change="onFogSettingsChanged"/>
      <!-- fog far -->
      <EsInputNumber v-if="fogSelect === 'Fog'" v-model:value="fogFar" size="tiny" :show-button="false"
                     class="w-30% ml-5px"
                     :min="0" :max="Infinity" :decimal="2" @change="onFogSettingsChanged"/>
      <!-- fog density -->
      <EsInputNumber v-if="fogSelect === 'FogExp2'" v-model:value="fogDensity" size="tiny" class="w-50% ml-10px"
                     :show-button="false" :min="0" :max="0.1" :decimal="3"
                     @change="onFogSettingsChanged"/>
    </div>

    <!-- 网格 -->
    <n-form-item :label="t('layout.sider.sceneConfig.Grid')">
      <n-switch size="small" v-model:value="grid"
                @update:value="useDispatchSignal('showGridChanged', grid)"/>
    </n-form-item>
    <!-- 辅助 -->
    <n-form-item :label="t('layout.sider.sceneConfig.Helpers')">
      <n-switch size="small" v-model:value="helpers"
                @update:value="useDispatchSignal('showHelpersChanged',helpers)"/>
    </n-form-item>
  </n-form>
</template>

<script setup lang="ts">
import {nextTick, onBeforeUnmount, onMounted, ref, unref} from "vue";
import {EquirectangularReflectionMapping} from "three";
import {t} from "@/language";
import {useAddSignal, useDispatchSignal,useRemoveSignal} from "@/hooks/useSignal";
import EsInputNumber from "@/components/es/EsInputNumber.vue";
import EsTexture from "@/components/es/EsTexture.vue";

//背景
const backgroundType = ref("Equirectangular");
const backgroundColor = ref('#000000');
const backgroundTexture = ref({});
const backgroundEquirectangularTexture = ref({});
const backgroundBlurriness = ref(0);
const backgroundIntensity = ref(1);
const backgroundRotation = ref(0);
//环境
const environmentSelect = ref("None");
const environmentTexture = ref({})
//雾
const fogSelect = ref("")
const fogColor = ref("");
const fogNear = ref(0.10);
const fogFar = ref(50.00);
const fogDensity = ref(0.05);
// 网格
const grid = ref(true);
// 辅助
const helpers = ref(true);

onMounted(async () => {
  await nextTick();
  refreshUI();

  useAddSignal("editorCleared", refreshUI);
  useAddSignal("sceneGraphChanged", refreshUI);
})

onBeforeUnmount(()=>{
  useRemoveSignal("editorCleared", refreshUI);
  useRemoveSignal("sceneGraphChanged", refreshUI);
})

// 更新树及背景/环境/雾
function refreshUI() {
  const scene = window.editor.scene;

  //背景
  if (scene.background) {
    if (scene.background.isColor) {
      backgroundType.value = 'Color';
      backgroundColor.value = scene.background.getHex();
    } else if (scene.background.isTexture) {
      if (scene.background.mapping === EquirectangularReflectionMapping) {
        backgroundType.value = 'Equirectangular';
        nextTick().then(_ => {
          backgroundEquirectangularTexture.value = scene.background;
          backgroundBlurriness.value = scene.backgroundBlurriness;
          backgroundIntensity.value = scene.backgroundIntensity;
        })
      } else {
        backgroundType.value = 'Texture';
        nextTick().then(_ => {
          backgroundTexture.value = scene.background;
        })
      }
    }
  } else {
    backgroundType.value = 'None';
  }

  //环境
  if (scene.environment) {
    if (scene.environment.mapping === EquirectangularReflectionMapping) {
      environmentSelect.value = "Equirectangular";
      nextTick().then(_ => {
        environmentTexture.value = scene.environment;
      })
    }else if(scene.environment.isRenderTargetTexture) {
      environmentSelect.value = 'ModelViewer';
    }
  } else {
    environmentSelect.value = "None";
  }

  //雾
  if (scene.fog) {
    fogColor.value = scene.fog.color.getHex();
    if (scene.fog.isFog) {
      fogSelect.value = 'Fog';

      fogNear.value = scene.fog.near;
      fogFar.value = scene.fog.far;
    } else if (scene.fog.isFogExp2) {
      fogSelect.value = 'FogExp2';
      fogDensity.value = scene.fog.density;
    }
  } else {
    fogSelect.value = 'None';
  }
}

//background Change Event
function onBackgroundChanged() {
  useDispatchSignal(
      "sceneBackgroundChanged",
      unref(backgroundType),
      unref(backgroundColor),
      unref(backgroundTexture),
      unref(backgroundEquirectangularTexture),
      unref(backgroundBlurriness),
      unref(backgroundIntensity),
      unref(backgroundRotation),
  );
}

//environment Change Event
function onEnvironmentChanged() {
  useDispatchSignal("sceneEnvironmentChanged", unref(environmentSelect), unref(environmentTexture));
}

//fog Change Event
function onFogChanged() {
  useDispatchSignal("sceneFogChanged", unref(fogSelect), unref(fogColor), unref(fogNear), unref(fogFar), unref(fogDensity));
}

function onFogSettingsChanged() {
  useDispatchSignal("sceneFogSettingsChanged", unref(fogSelect), unref(fogColor), unref(fogNear), unref(fogFar), unref(fogDensity));
}
</script>