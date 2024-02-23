<script lang="ts" setup>
import {reactive, ref, h, VNode, onMounted} from 'vue';
import {NForm, NFormItem, NCheckbox, NSelect, SelectOption, NTooltip} from 'naive-ui';
import * as THREE from "three";
import WebGPU from 'three/examples/jsm/capabilities/WebGPU.js';
import WebGPURenderer from 'three/examples/jsm/renderers/webgpu/WebGPURenderer.js';
import {useAddSignal, useDispatchSignal} from '@/hooks/useSignal';
import EsInputNumber from '@/components/es/EsInputNumber.vue';
import {t} from "@/language";

//编辑器渲染器在此创建
let currentRenderer: THREE.WebGLRenderer /** | WebGPURenderer**/;

/* 渲染器设置项 */
//阴影选项
const shadowTypeOptions = ref([
  {label: "Basic", value: 0},
  {label: "PCF", value: 1},
  {label: "PCF Soft", value: 2}
]);
//色调映射选项
const toneMappingOptions = ref([
  {label: "No", value: 0},
  {label: "Linear", value: 1},
  {label: "Reinhard", value: 2},
  {label: "Cineon", value: 3},
  {label: "ACESFilmic", value: 4}
]);
const renderToneMappingOption = ({node, option}: { node: VNode; option: SelectOption }) => {
  return h(NTooltip, null, {
    trigger: () => node,
    default: () => option.label
  })
}
const renderModel = reactive({
  antialias: true,
  physicalLights: false,
  shadows: true,
  shadowType: 1,
  toneMapping: 0,
  toneMappingExposure: 0.00,
})

onMounted(() => {
  createRenderer();

  //场景清空时
  useAddSignal("editorCleared", () => {
    currentRenderer.physicallyCorrectLights = false;
    currentRenderer.shadowMap.enabled = true;
    currentRenderer.shadowMap.type = THREE.PCFShadowMap;
    currentRenderer.toneMapping = THREE.NoToneMapping;
    currentRenderer.toneMappingExposure = 1;

    renderModel.physicalLights = currentRenderer.physicallyCorrectLights;
    renderModel.shadows = currentRenderer.shadowMap.enabled;
    renderModel.shadowType = currentRenderer.shadowMap.type;
    renderModel.toneMapping = currentRenderer.toneMapping;
    renderModel.toneMappingExposure = currentRenderer.toneMappingExposure;

    useDispatchSignal("rendererUpdated");
  })

  //保存渲染器配置
  useAddSignal("rendererUpdated", () => {
    window.editor.config.setKey(
        'project/renderer/antialias', renderModel.antialias,
        'project/renderer/physicallyCorrectLights', renderModel.physicalLights,
        'project/renderer/shadows', renderModel.shadows,
        'project/renderer/shadowType', renderModel.shadowType,
        'project/renderer/toneMapping', renderModel.toneMapping,
        'project/renderer/toneMappingExposure', renderModel.toneMappingExposure
    );
  })
})

function createRenderer() {
  // 判断是否支持WebGPU
  // if (WebGPU.isAvailable()) {
  //   console.log("使用WebGPU渲染器");
  //   currentRenderer = new WebGPURenderer({antialias: renderModel.antialias});
  //   currentRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  //   currentRenderer.toneMappingExposure = 1;
  //   // @ts-ignore
  //   currentRenderer.useLegacyLights = false;
  // }else{
    currentRenderer = new THREE.WebGLRenderer({
      antialias: renderModel.antialias,
      //想把canvas画布上内容下载到本地，需要设置为true
      preserveDrawingBuffer:true
    });
    currentRenderer.outputEncoding = THREE.sRGBEncoding;
    currentRenderer.physicallyCorrectLights = renderModel.physicalLights;
    currentRenderer.toneMapping = renderModel.toneMapping;
    currentRenderer.toneMappingExposure = renderModel.toneMappingExposure;

    currentRenderer.shadowMap.enabled = renderModel.shadows;
    currentRenderer.shadowMap.type = renderModel.shadowType;
  // }

  useDispatchSignal("rendererCreated", currentRenderer);
  useDispatchSignal("rendererUpdated");
}

function handlerPhysicalLightsChange() {
  currentRenderer.physicallyCorrectLights = renderModel.physicalLights;
  useDispatchSignal("rendererUpdated");
}

function updateShadows() {
  currentRenderer.shadowMap.enabled = renderModel.shadows;
  currentRenderer.shadowMap.type = renderModel.shadowType;
  useDispatchSignal("rendererUpdated");
}

function updateToneMapping() {
  currentRenderer.toneMapping = renderModel.toneMapping;
  currentRenderer.toneMappingExposure = renderModel.toneMappingExposure;
  useDispatchSignal("rendererUpdated");
}
</script>

<template>
  <n-form label-placement="left" :label-width="90" label-align="left" size="small" class="px-4">
    <n-form-item :label="t('layout.sider.project.antialias')">
      <n-checkbox v-model:checked="renderModel.antialias" @update:checked="createRenderer"></n-checkbox>
    </n-form-item>
    <n-form-item :label="t('layout.sider.project[\'physical lights\']')">
      <n-checkbox v-model:checked="renderModel.physicalLights" @update:checked="handlerPhysicalLightsChange">
      </n-checkbox>
    </n-form-item>
    <n-form-item :label="t('layout.sider.project.shadows')">
      <n-checkbox v-model:checked="renderModel.shadows" @update:checked="updateShadows"></n-checkbox>
      <n-select v-model:value="renderModel.shadowType" :options="shadowTypeOptions" class="ml-1" size="tiny"
                @update:value="updateShadows"/>
    </n-form-item>
    <n-form-item :label="t('layout.sider.project[\'tone mapping\']')">
      <n-select v-model:value="renderModel.toneMapping" :options="toneMappingOptions" class="ml-1" size="tiny"
                :render-option="renderToneMappingOption" @update:value="updateToneMapping"/>
      <EsInputNumber v-if="renderModel.toneMapping !== 0" v-model:value="renderModel.toneMappingExposure"
                     :min="0.00" size="tiny" :step="0.01" :show-button="false" class="ml-1 w-100px"
                     @change="updateToneMapping"/>
    </n-form-item>
  </n-form>
</template>