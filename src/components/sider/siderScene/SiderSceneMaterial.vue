<script lang="ts" setup>
import {inject, ref, reactive, onMounted} from "vue";
import {useAddSignal, useDispatchSignal} from "@/hooks/useSignal";
import {ReloadCircleOutline} from "@vicons/ionicons5";
import {SetMaterialValueCommand} from '@/core/commands/SetMaterialValueCommand';
import {SetMaterialCommand} from '@/core/commands/SetMaterialCommand';
import * as THREE from 'three';
import SiderSceneMaterialProgram from "./siderSceneMaterial/SiderSceneMaterialProgram.vue";
import SiderSceneMaterialColorProperty from "./siderSceneMaterial/SiderSceneMaterialColorProperty.vue";
import SiderSceneMaterialNumberProperty from "./siderSceneMaterial/SiderSceneMaterialNumberProperty.vue";
import SiderSceneMaterialRangeValueProperty from "./siderSceneMaterial/SiderSceneMaterialRangeValueProperty.vue";
import SiderSceneMaterialBooleanProperty from "./siderSceneMaterial/SiderSceneMaterialBooleanProperty.vue";
import SiderSceneMaterialConstantProperty from "./siderSceneMaterial/SiderSceneMaterialConstantProperty.vue";
import SiderSceneMaterialMapProperty from "./siderSceneMaterial/SiderSceneMaterialMapProperty.vue";
import {t} from "@/language";

const hasMaterial = ref(false);
const objectData = reactive({
  slot: 0,
  type: "",
  uuid: "",
  name: "",
  userData: ""
})
const slotOptions = ref<Array<{ label: string, value: number }>>([]);
const typeOptions = ref<Array<{ label: string, value: string }>>([]);
const materialClasses = {
  'LineBasicMaterial': THREE.LineBasicMaterial,
  'LineDashedMaterial': THREE.LineDashedMaterial,
  'MeshBasicMaterial': THREE.MeshBasicMaterial,
  'MeshDepthMaterial': THREE.MeshDepthMaterial,
  'MeshNormalMaterial': THREE.MeshNormalMaterial,
  'MeshLambertMaterial': THREE.MeshLambertMaterial,
  'MeshMatcapMaterial': THREE.MeshMatcapMaterial,
  'MeshPhongMaterial': THREE.MeshPhongMaterial,
  'MeshToonMaterial': THREE.MeshToonMaterial,
  'MeshStandardMaterial': THREE.MeshStandardMaterial,
  'MeshPhysicalMaterial': THREE.MeshPhysicalMaterial,
  'RawShaderMaterial': THREE.RawShaderMaterial,
  'ShaderMaterial': THREE.ShaderMaterial,
  'ShadowMaterial': THREE.ShadowMaterial,
  'SpriteMaterial': THREE.SpriteMaterial,
  'PointsMaterial': THREE.PointsMaterial
};
const vertexShaderVariables = [
  'uniform mat4 projectionMatrix;',
  'uniform mat4 modelViewMatrix;\n',
  'attribute vec3 position;\n\n',
].join('\n');
const meshMaterialOptions = [
  {label: "MeshBasicMaterial", value: "MeshBasicMaterial"},
  {label: "MeshDepthMaterial", value: "MeshDepthMaterial"},
  {label: "MeshNormalMaterial", value: "MeshNormalMaterial"},
  {label: "MeshLambertMaterial", value: "MeshLambertMaterial"},
  {label: "MeshMatcapMaterial", value: "MeshMatcapMaterial"},
  {label: "MeshPhongMaterial", value: "MeshPhongMaterial"},
  {label: "MeshToonMaterial", value: "MeshToonMaterial"},
  {label: "MeshStandardMaterial", value: "MeshStandardMaterial"},
  {label: "MeshPhysicalMaterial", value: "MeshPhysicalMaterial"},
  {label: "RawShaderMaterial", value: "RawShaderMaterial"},
  {label: "ShaderMaterial", value: "ShaderMaterial"},
  {label: "ShadowMaterial", value: "ShadowMaterial"}
];
const lineMaterialOptions = [
  {label: "LineBasicMaterial", value: "LineBasicMaterial"},
  {label: "LineDashedMaterial", value: "LineDashedMaterial"},
  {label: "RawShaderMaterial", value: "RawShaderMaterial"},
  {label: "ShaderMaterial", value: "ShaderMaterial"}
];
const spriteMaterialOptions = [
  {label: "SpriteMaterial", value: "SpriteMaterial"},
  {label: "RawShaderMaterial", value: "RawShaderMaterial"},
  {label: "ShaderMaterial", value: "ShaderMaterial"}
];
const pointsMaterialOptions = [
  {label: "PointsMaterial", value: "PointsMaterial"},
  {label: "RawShaderMaterial", value: "RawShaderMaterial"},
  {label: "ShaderMaterial", value: "ShaderMaterial"}
];

let currentObject;
let currentMaterialSlot = 0;


onMounted(() => {
  signalsAdd()
})

function signalsAdd() {
  useAddSignal("objectSelected", (object) => {
    let hasMaterialCopy = false;
    if (object && object.material) {
      hasMaterialCopy = true;
      if (Array.isArray(object.material) && object.material.length === 0) {
        hasMaterialCopy = false;
      }
    }
    if (hasMaterialCopy) {
      currentObject = object;
      refreshUI();
      hasMaterial.value = true;
    } else {
      currentObject = null;
      hasMaterial.value = false;
    }
  })
  useAddSignal("materialChanged", refreshUI);
}

function updateSlot() {
  console.log("update Material Slot")
  currentMaterialSlot = objectData.slot;
  refreshUI();
}

const update = () => {
  let material = window.editor.getObjectMaterial(currentObject, currentMaterialSlot);

  if (material) {
    if (material.uuid !== undefined && material.uuid !== objectData.uuid) {
      window.editor.execute(new SetMaterialValueCommand(currentObject, 'uuid', objectData.uuid, currentMaterialSlot));
    }

    if (material.type !== objectData.type) {
      material = new materialClasses[objectData.type]();

      if (material.type === 'RawShaderMaterial') {
        material.vertexShader = vertexShaderVariables + material.vertexShader;
      }

      if (Array.isArray(currentObject.material)) {
        // 不要移除多个材质。仅移除所选的材质
        window.editor.removeMaterial(currentObject.material[currentMaterialSlot]);
      } else {
        window.editor.removeMaterial(currentObject.material);
      }

      window.editor.execute(new SetMaterialCommand(currentObject, material, currentMaterialSlot), 'New Material: ' + objectData.type);
      window.editor.addMaterial(material);
      // TODO 复制场景图中的其他引用
      //保留当前名称和UUID
      //也应该有办法创造一个独特的
      //为当前对象显式复制
      //将当前材料附加到其他对象。
    }

    try {
      const userData = JSON.parse(objectData.userData);
      if (JSON.stringify(material.userData) != JSON.stringify(userData)) {
        window.editor.execute(new SetMaterialValueCommand(currentObject, 'userData', userData, currentMaterialSlot));
      }
    } catch (exception) {
      console.warn(exception);
    }
    refreshUI();
  }
}

function refreshUI() {
  if (!currentObject) return;
  let material = currentObject.material;
  if (Array.isArray(material)) {
    const options: Array<{ label: string, value: number }> = [];
    currentMaterialSlot = Math.max(0, Math.min(material.length, currentMaterialSlot));

    for (let i = 0; i < material.length; i++) {
      options.push({
        label: String(i + 1) + ': ' + material[i].name,
        value: i
      })
    }

    slotOptions.value = options;
    objectData.slot = currentMaterialSlot;
  }

  material = window.editor.getObjectMaterial(currentObject, currentMaterialSlot);

  useDispatchSignal('materialCurrentSlotChange', currentMaterialSlot);

  if (material.uuid !== undefined) {
    objectData.uuid = material.uuid;
  }
  if (material.name !== undefined) {
    objectData.name = material.name;
  }
  if (currentObject.isMesh) {
    typeOptions.value = meshMaterialOptions;
  } else if (currentObject.isSprite) {
    typeOptions.value = spriteMaterialOptions;
  } else if (currentObject.isPoints) {
    typeOptions.value = pointsMaterialOptions;
  } else if (currentObject.isLine) {
    typeOptions.value = lineMaterialOptions;
  }
  objectData.type = material.type;

  setRowVisibility();

  try {
    objectData.userData = JSON.stringify(material.userData, null, '  ');
  } catch (error) {
    console.log(error);
  }
}

const materialSlotIsShow = ref(false);

function setRowVisibility() {
  const material = currentObject.material;

  if (Array.isArray(material)) {
    materialSlotIsShow.value = true;
  } else {
    materialSlotIsShow.value = false;
  }
}

//更新uuid
function newUUID() {
  objectData.uuid = THREE.MathUtils.generateUUID();
  update();
}

//更新name
function updateName() {
  window.editor.execute(new SetMaterialValueCommand(window.editor.selected, 'name', objectData.name, currentMaterialSlot));
}

const userDataStatus = ref<any>(undefined)
const userDataInput = () => {
  try {
    JSON.parse(objectData.userData);
    userDataStatus.value = 'success';
  } catch (error) {
    userDataStatus.value = 'error';
  }
}
</script>

<template>
  <div id="sider-scene-material" v-show="hasMaterial">
    <!-- Current material slot -->
    <div class="sider-scene-material-item" v-if="materialSlotIsShow">
      <span>{{ t("layout.sider.scene.slot") }}</span>
      <div>
        <n-select size="small" v-model:value="objectData.slot" :options="slotOptions" @update:value="updateSlot"/>
      </div>
    </div>
    <!-- type -->
    <div class="sider-scene-material-item">
      <span>{{ t("layout.sider.scene.type") }}</span>
      <div>
        <n-select size="small" v-model:value="objectData.type" :options="typeOptions" @update:value="update"/>
      </div>
    </div>
    <!-- uuid -->
    <div class="sider-scene-material-item">
      <span>{{ t("layout.sider.scene.uuid") }}</span>
      <div class="flex items-center">
        <n-tooltip trigger="hover">
          <template #trigger>
            <span class="uuid">{{ objectData.uuid }}</span>
          </template>
          {{ objectData.uuid }}
        </n-tooltip>
        <n-button quaternary circle type="warning" v-if="objectData.uuid" @click="newUUID">
          <template #icon>
            <n-icon>
              <ReloadCircleOutline/>
            </n-icon>
          </template>
        </n-button>
      </div>
    </div>
    <!-- name -->
    <div class="sider-scene-material-item">
      <span>{{ t("layout.sider.scene.name") }}</span>
      <div>
        <n-input v-model:value="objectData.name" type="text" size="small" @update:value="updateName"/>
      </div>
    </div>

    <!-- program -->
    <SiderSceneMaterialProgram property="vertexShader"/>

    <!-- color -->
    <SiderSceneMaterialColorProperty property="color" name="Color"/>

    <!-- specular -->
    <SiderSceneMaterialColorProperty property="specular" name="Specular"/>

    <!-- shininess -->
    <SiderSceneMaterialNumberProperty property="shininess" name="Shininess"/>

    <!-- emissive -->
    <SiderSceneMaterialColorProperty property="emissive" name="Emissive"/>

    <!-- reflectivity -->
    <SiderSceneMaterialNumberProperty property="reflectivity" name="Reflectivity"/>

    <!-- roughness -->
    <SiderSceneMaterialNumberProperty property="roughness" name="Roughness" :range="[0, 1]"/>

    <!-- metalness -->
    <SiderSceneMaterialNumberProperty property="metalness" name="Metalness" :range="[0, 1]"/>

    <!-- clearcoat -->
    <SiderSceneMaterialNumberProperty property="clearcoat" name="Clearcoat" :range="[0, 1]"/>

    <!-- clearcoatRoughness -->
    <SiderSceneMaterialNumberProperty property="clearcoatRoughness" name="Clearcoat Roughness" :range="[0, 1]"/>

    <!-- iridescence -->
    <SiderSceneMaterialNumberProperty property="iridescence" name="Iridescence" :range="[0, 1]"/>

    <!-- iridescenceIOR -->
    <SiderSceneMaterialNumberProperty property="iridescenceIOR" name="Thin-Film IOR" :range="[1, 5]"/>

    <!-- iridescenceThicknessMax -->
    <SiderSceneMaterialRangeValueProperty property="iridescenceThicknessRange" name="Thin-Film Thickness"
                                          :isMin="false" :range="[0, Infinity]" unit="nm" :step="10"/>

    <!-- sheen -->
    <SiderSceneMaterialNumberProperty property="sheen" name="Sheen" :range="[0, 1]"/>

    <!-- sheenRoughness -->
    <SiderSceneMaterialNumberProperty property="sheenRoughness" name="Sheen Roughness" :range="[0, 1]"/>

    <!-- specular -->
    <SiderSceneMaterialColorProperty property="sheenColor" name="Sheen Color"/>

    <!-- transmission 透光 -->
    <SiderSceneMaterialNumberProperty property="transmission" name="Transmission" :range="[0, 1]"/>

    <!-- attenuation distance 衰减距离 -->
    <SiderSceneMaterialNumberProperty property="attenuationDistance" name="Attenuation Distance"/>

    <!-- attenuation tint 衰减色 -->
    <SiderSceneMaterialColorProperty property="attenuationColor" name="Attenuation Color"/>

    <!-- thickness 厚度 -->
    <SiderSceneMaterialNumberProperty property="thickness" name="Thickness"/>

    <!-- vertex colors 顶点颜色 -->
    <SiderSceneMaterialBooleanProperty property="vertexColors" name="Vertex Colors"/>

    <!-- depth packing 深度包装 -->
    <SiderSceneMaterialConstantProperty property="depthPacking" name="Depth Packing"
                                        :options="[{ label: 'Basic', value: [THREE.BasicDepthPacking] }, { label: 'RGBA', value: [THREE.RGBADepthPacking] }]"/>

    <!-- map 贴图 -->
    <SiderSceneMaterialMapProperty property="map" name="Map"/>

    <!-- specular map 高光贴图 -->
    <SiderSceneMaterialMapProperty property="specularMap" name="Specular Map"/>

    <!-- emissive map 自发光贴图 -->
    <SiderSceneMaterialMapProperty property="emissiveMap" name="Emissive Map"/>

    <!-- matcap map 材质捕获 -->
    <SiderSceneMaterialMapProperty property="matcap" name="Matcap"/>

    <!-- alpha map 透明贴图 -->
    <SiderSceneMaterialMapProperty property="alphaMap" name="Alpha Map"/>

    <!-- bump map 凹凸贴图 -->
    <SiderSceneMaterialMapProperty property="bumpMap" name="Bump Map"/>

    <!-- normal map 法线贴图 -->
    <SiderSceneMaterialMapProperty property="normalMap" name="Normal Map"/>

    <!-- clearcoat normal map 清漆法线贴图 -->
    <SiderSceneMaterialMapProperty property="clearcoatNormalMap" name="Clearcoat Normal Map"/>

    <!-- displacement map 置换贴图 -->
    <SiderSceneMaterialMapProperty property="displacementMap" name="Displace Map"/>

    <!-- roughness map 粗糙贴图 -->
    <SiderSceneMaterialMapProperty property="roughnessMap" name="Rough Map"/>

    <!-- metalness map 金属贴图 -->
    <SiderSceneMaterialMapProperty property="metalnessMap" name="Metal Map"/>

    <!-- iridescence map 彩虹色贴图 -->
    <SiderSceneMaterialMapProperty property="iridescenceMap" name="Irid Map"/>

    <!-- sheen color map -->
    <SiderSceneMaterialMapProperty property="sheenColorMap" name="Sheen Color Map"/>

    <!-- sheen roughness map -->
    <SiderSceneMaterialMapProperty property="sheenRoughnessMap" name="Sheen Rough. Map"/>

    <!-- iridescence thickness map 彩虹色厚度贴图 -->
    <SiderSceneMaterialMapProperty property="iridescenceThicknessMap" name="Thin-Film Thickness Map"/>

    <!-- env map 环境贴图 -->
    <SiderSceneMaterialMapProperty property="envMap" name="Env Map"/>

    <!-- light map 环境贴图 -->
    <SiderSceneMaterialMapProperty property="lightMap" name="Light Map"/>

    <!-- ambient occlusion map 环境光遮蔽贴图 -->
    <SiderSceneMaterialMapProperty property="aoMap" name="AO Map"/>

    <!-- gradient map 渐变贴图 -->
    <SiderSceneMaterialMapProperty property="gradientMap" name="Gradient Map"/>

    <!-- transmission map 透光贴图 -->
    <SiderSceneMaterialMapProperty property="transmissionMap" name="Transmission Map"/>

    <!-- thickness map 厚度贴图 -->
    <SiderSceneMaterialMapProperty property="thicknessMap" name="Thickness Map"/>

    <!-- side 面 -->
    <SiderSceneMaterialConstantProperty property="side" name="Side" :options="[
            { label: 'Front', value:0 },
            { label: 'Back', value: 1 },
            { label: 'Double', value: 2 }
        ]"/>

    <!-- size 大小 -->
    <SiderSceneMaterialNumberProperty property="size" name="Size" :range="[0, Infinity]"/>

    <!-- sizeAttenuation 大小衰减 -->
    <SiderSceneMaterialBooleanProperty property="sizeAttenuation" name="Size Attenuation"/>

    <!-- flatShading 平面着色 -->
    <SiderSceneMaterialBooleanProperty property="flatShading" name="Flat Shading"/>

    <!-- blending 混合 -->
    <SiderSceneMaterialConstantProperty property="blending" name="Blending" :options="[
            { label: 'No', value:0 },
            { label: 'Normal', value: 1 },
            { label: 'Additive', value: 2 },
            { label: 'Subtractive', value: 3 },
            { label: 'Multiply', value: 4 },
            { label: 'Custom', value: 5 }
        ]"/>

    <!-- opacity 透明度 -->
    <SiderSceneMaterialNumberProperty property="opacity" name="Opacity" :decimal="1" :range="[0, 1]"/>

    <!-- transparent 透明性 -->
    <SiderSceneMaterialBooleanProperty property="transparent" name="Transparent"/>

    <!-- alpha test α测试 -->
    <SiderSceneMaterialNumberProperty property="alphaTest" name="Alpha Test" :decimal="1" :range="[0, 1]"/>

    <!-- depth test 深度测试 -->
    <SiderSceneMaterialBooleanProperty property="depthTest" name="Depth Test"/>

    <!-- depth write 深度缓冲 -->
    <SiderSceneMaterialBooleanProperty property="depthWrite" name="Depth Write"/>

    <!-- wireframe 线框 -->
    <SiderSceneMaterialBooleanProperty property="wireframe" name="Wireframe"/>

    <!-- userdata 自定义数据 -->
    <div class="sider-scene-material-item">
      <span>{{ t("layout.sider.scene.userdata") }}</span>
      <div>
        <n-input type="textarea" v-model:value="objectData.userData" round :rows="5" :status="userDataStatus"
                 @update:value="update" @input="userDataInput"/>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
#sider-scene-material {
  .sider-scene-material-item {
    display: flex;
    justify-content: space-around;
    margin: 0.4rem 0;
    align-items: center;

    & > span {
      width: 4rem;
      padding-left: 0.5rem;
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
}
</style>
