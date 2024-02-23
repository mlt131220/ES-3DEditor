<script lang="ts" setup>
import {h, ref, unref, inject, onMounted, nextTick} from "vue";
import * as THREE from "three";
import {TreeOption, TreeDropInfo, NIcon, NBadge, NEllipsis} from "naive-ui";
import {SunnyOutline, PlanetOutline} from '@vicons/ionicons5';

import {useAddSignal, useDispatchSignal} from "@/hooks/useSignal";
import SiderSceneTab from "./siderScene/SiderSceneTab.vue";
import {escapeHTML, findSiblingsAndIndex} from "@/utils/common/utils";
import {getMaterialName} from "@/utils/common/scenes";
import EsTexture from '@/components/es/EsTexture.vue';
import EsInputNumber from '@/components/es/EsInputNumber.vue';
import {MoveObjectCommand} from "@/core/commands/Commands"

const sceneTreeRef = ref();
const pattern = ref("");
const sceneTreeData = ref<TreeOption[]>([]);
const sceneTreeSelected = ref<Array<string | number>>([]);
const renderSwitcherIconWithExpaned = ({expanded}: { expanded: boolean }) =>
    h(NIcon, null, {
      default: () => h(expanded ? SunnyOutline : PlanetOutline)
    })
const sceneTreeExpandedKeys = ref<number[]>([]);

//背景
const backgroundType = ref("Equirectangular");
const backgroundColor = ref('#000000');
const backgroundTexture = ref({});
const backgroundEquirectangularTexture = ref({});
const backgroundBlurriness = ref(0);

//环境
const environmentSelect = ref("None");
const environmentTexture = ref({})
//雾
const fogSelect = ref("")
const fogColor = ref("");
const fogNear = ref(0.10);
const fogFar = ref(50.00);
const fogDensity = ref(0.05);
import {t} from "@/language";

onMounted(async () => {
  await nextTick();
  refreshUI();
  signalsAdd();
})

// 注册相关的signal
function signalsAdd() {
  useAddSignal("editorCleared", refreshUI);
  useAddSignal("sceneGraphChanged", refreshUI);
  useAddSignal("objectSelected", function (object) {
    if (object !== null && object.parent !== null) {
      sceneTreeSelected.value = [object.id];
      // 将此id父级递归展开
      sceneTreeExpandedKeys.value = [window.editor.scene.id];
      function getParentId(obj){
        if(obj.parent.id !== window.editor.scene.id){
          sceneTreeExpandedKeys.value.push(obj.parent.id);
          getParentId(obj.parent);
        }
      }
      getParentId(object)

      //在虚拟滚动模式下滚动到某个节点
      sceneTreeRef.value?.scrollTo({key: object.id})
    } else {
      sceneTreeSelected.value = [];
    }
  });
}

// 更新树及背景/环境/雾
function refreshUI() {
  const camera = window.editor.camera;
  const scene = window.editor.scene;

  sceneTreeData.value = [];
  sceneTreeData.value.push({
    label: window.$cpt("core.editor['Default Camera']"),
    key: camera.id,
    isLeaf: true
  });
  sceneTreeData.value.push({
    label: window.$cpt("core.editor['Default Scene']"),
    key: scene.id,
    isLeaf: false,
    children: addObjects(scene)
  });

  sceneTreeExpandedKeys.value = [scene.id];

  function addObjects(object3D) {
    const childArr: TreeOption[] = [];
    //for循环 为大场景提升遍历效率
    for (let i = 0, l = object3D.children.length; i < l; i++) {
      const child = object3D.children[i];
      const data: TreeOption = {
        label: escapeHTML(child.name),
        key: child.id,
        // isLeaf: child.children.length === 0 && child.type !== "Group"
        isLeaf: child.children.length === 0
      }
      if (child.children.length > 0) {
        data.children = addObjects(child);
      }

      if (child.isMesh) {
        const geometry = child.geometry;
        const material = child.material;

        data.suffix = () => {
          return h('div', {class: "ml-4 text-12px"}, [
            h(
                NBadge,
                {dot: true, type: 'success'},
                {},
            ),
            h(NEllipsis, {class: "!max-w-100px"}, {
              default: () => h("span", {class: 'ml-1 mr-2'}, {default: () => escapeHTML(geometry.name)})
            }),
            h(
                NBadge,
                {dot: true, type: 'warning'},
                {},
            ),
            h(NEllipsis, {class: "!max-w-100px"}, {
              default: () => h("span", {class: 'ml-1 mr-2'}, {default: () => escapeHTML(getMaterialName(material))})
            }),

          ])
        }
      }
      childArr.push(data);
    }
    return childArr;
  }

  if (window.editor.selected !== null) {
    sceneTreeSelected.value = [window.editor.selected.id];
  }

  //背景
  if (scene.background) {
    if (scene.background.isColor) {
      backgroundType.value = 'Color';
      backgroundColor.value = scene.background.getHex();
    } else if (scene.background.isTexture) {
      if (scene.background.mapping === THREE.EquirectangularReflectionMapping) {
        backgroundType.value = 'Equirectangular';
        nextTick().then(_ => {
          backgroundEquirectangularTexture.value = scene.background;
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
    if (scene.environment.mapping === THREE.EquirectangularReflectionMapping) {
      environmentSelect.value = "Equirectangular";
      nextTick().then(_ => {
        environmentTexture.value = scene.environment;
      })
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

//移动模型
function moveObject(object, newParent, nextObject) {
  if (nextObject === null) nextObject = undefined;

  let newParentIsChild = false;

  object.traverse(function (child) {
    if (child === newParent) newParentIsChild = true;
  });

  if (newParentIsChild) return;

  window.editor.execute(new MoveObjectCommand(object, newParent, nextObject));
}

/**
 * 处理树节点拖动
 * @param node 拖动到的目标位置节点
 * @param dragNode 被拖动的节点
 * @param dropPosition 拖动到的相对于目标节点的位置
 */
function handleSceneTreeDrop({node, dragNode, dropPosition}: TreeDropInfo) {
  //无法移动到默认场景之外
  if (node.label === window.$t("core.editor['Default Camera']") || node.label === window.$t("core.editor['Default Scene']")) return;
  // 要拖动到的目标模型
  const targetParentObject3D = window.editor.scene.getObjectById(Number(node.key));
  // 被拖动的模型
  const dragObject3D = window.editor.scene.getObjectById(Number(dragNode.key));

  const [dragNodeSiblings, dragNodeIndex] = findSiblingsAndIndex(dragNode, sceneTreeData.value);
  if (dragNodeSiblings === null || dragNodeIndex === null) return;
  //在被拖动节点的父级中删除该节点
  dragNodeSiblings.splice(dragNodeIndex, 1);

  switch (dropPosition) {
    case "inside":
      if (node.children) {
        node.children.unshift(dragNode)
      } else {
        node.children = [dragNode]
      }
      // 移动模型
      moveObject(dragObject3D, targetParentObject3D, null);
      break;
    case "before":
      // 寻找目标位置节点的父级及该节点的索引
      const [_nodeSiblings, _nodeIndex] = findSiblingsAndIndex(node, sceneTreeData.value);
      if (_nodeSiblings === null || _nodeIndex === null) return;
      _nodeSiblings.splice(_nodeIndex, 0, dragNode);
      // 移动模型
      moveObject(dragObject3D, targetParentObject3D.parent, targetParentObject3D);
      break;
    case "after":
      const [nodeSiblings, nodeIndex] = findSiblingsAndIndex(node, sceneTreeData.value);
      if (nodeSiblings === null || nodeIndex === null) return
      nodeSiblings.splice(nodeIndex + 1, 0, dragNode);
      // 移动模型
      moveObject(dragObject3D, targetParentObject3D.parent, targetParentObject3D.parent.children[targetParentObject3D.parent.children.indexOf(targetParentObject3D) + 1]);
      break;
  }

  sceneTreeData.value = Array.from(sceneTreeData.value);
}

// 判断树节点是否可拖动到对应选择位置（拖动到内部时只能是Group / Scene）
function allowDrop({dropPosition, node}) {
  if (dropPosition === "inside") {
    // 要拖动到的目标模型
    const targetParentObject3D = window.editor.scene.getObjectById(Number(node.key));

    if (targetParentObject3D?.type !== "Group" && targetParentObject3D?.type !== "Scene") {
      return false
    }
  }

  return true;
}

//场景树节点选中/取消选中事件
function handlerTreeSelectChange(keys: Array<number>, option: Array<TreeOption>, meta: {
  node: TreeOption,
  action: 'select' | 'unselect'
}) {
  sceneTreeSelected.value = keys;
  if (meta.action === "select") {
    window.editor.selectById(keys[0]);
  } else {
    window.editor.deselect();
  }
}

//background Change Event
function onBackgroundChanged() {
  useDispatchSignal("sceneBackgroundChanged", unref(backgroundType), unref(backgroundColor), unref(backgroundTexture), unref(backgroundEquirectangularTexture), unref(backgroundBlurriness));
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

<template>
  <div class="scene-top">
    <n-card hoverable>
      <n-input v-model:value="pattern" :placeholder="t('layout.sider.scene.search')"/>
      <n-tree :pattern="pattern"
              :data="sceneTreeData"
              v-model:selected-keys="sceneTreeSelected"
              :show-irrelevant-nodes="false"
              :render-switcher-icon="renderSwitcherIconWithExpaned"
              v-model:expanded-keys="sceneTreeExpandedKeys"
              draggable
              :allow-drop="allowDrop"
              @drop="handleSceneTreeDrop"
              @update:selected-keys="handlerTreeSelectChange"
              ref="sceneTreeRef" block-line virtual-scroll
      />
    </n-card>

    <n-form label-placement="left" :label-width="90" label-align="left" size="small" class="pl-2">
      <!-- background -->
      <n-form-item :label="t('layout.sider.scene.Background')">
        <n-select v-model:value="backgroundType" @update:value="onBackgroundChanged"
                  :options="[{ label: '', value: 'None' }, { label: 'Color', value: 'Color' }, { label: 'Texture', value: 'Texture' }, { label: 'Equirect', value: 'Equirectangular' }]"/>
      </n-form-item>
      <div class="flex justify-start items-center pl-90px pb-1">
        <n-color-picker v-if="backgroundType === 'Color'" v-model:value="backgroundColor" :show-alpha="false"
                        :modes="['hex']" @update:value="onBackgroundChanged" size="small"/>
        <EsTexture v-if="backgroundType === 'Texture'" v-model:texture="backgroundTexture"
                   @change="onBackgroundChanged"/>
        <EsTexture v-if="backgroundType === 'Equirectangular'"
                   v-model:texture="backgroundEquirectangularTexture" @change="onBackgroundChanged"/>
        <EsInputNumber v-if="backgroundType === 'Equirectangular'" v-model:value="backgroundBlurriness"
                       size="tiny" :show-button="false" :min="0" :max="1" :bordered="false" :step="0.01"
                       @change="onBackgroundChanged" class="w-60px ml-1"/>
      </div>

      <!-- environment -->
      <n-form-item :label="t('layout.sider.scene.Environment')">
        <n-select v-model:value="environmentSelect" @update:value="onEnvironmentChanged"
                  :options="[{ label: '', value: 'None' }, { label: 'Equirect', value: 'Equirectangular' }, { label: 'Modelviewer', value: 'ModelViewer' }]"/>
      </n-form-item>
      <div class="pl-90px pb-1">
        <EsTexture v-if="environmentSelect === 'Equirectangular'" v-model:texture="environmentTexture"
                   @change="onEnvironmentChanged"/>
      </div>


      <!-- fog -->
      <n-form-item :label="t('layout.sider.scene.Fog')">
        <n-select v-model:value="fogSelect" @update:value="onFogChanged"
                  :options="[{ label: '', value: 'None' }, { label: 'Linear', value: 'Fog' }, { label: 'Exponential', value: 'FogExp2' }]"/>
      </n-form-item>
      <div class="flex justify-start items-center pl-90px pb-1" v-if="fogSelect !== 'None'">
        <!-- fog color -->
        <n-color-picker v-model:value="fogColor" :show-alpha="false" :modes="['hex']" size="small"
                        @update:value="onFogSettingsChanged"/>
        <!-- fog near -->
        <EsInputNumber v-if="fogSelect === 'Fog'" v-model:value="fogNear" size="tiny" :show-button="false"
                       class="min-w-55px ml-1"
                       :min="0" :max="Infinity" :bordered="false" :step="0.01" @change="onFogSettingsChanged"/>
        <!-- fog far -->
        <EsInputNumber v-if="fogSelect === 'Fog'" v-model:value="fogFar" size="tiny" :show-button="false"
                       class="min-w-55px ml-1"
                       :min="0" :max="Infinity" :bordered="false" :step="0.01" @change="onFogSettingsChanged"/>
        <!-- fog density -->
        <EsInputNumber v-if="fogSelect === 'FogExp2'" v-model:value="fogDensity" size="tiny" class="min-w-60px ml-1"
                       :show-button="false" :min="0" :max="0.1" :bordered="false" :step="0.001"
                       @change="onFogSettingsChanged"/>
      </div>
    </n-form>
  </div>
  <SiderSceneTab/>
</template>

<style lang="less" scoped>
.scene-top {
  padding: 0 0.5rem;

  .n-card {
    :deep(.n-card__content) {
      padding: 0.5rem;
    }

    .n-input {
      margin-bottom: 0.5rem;
    }

    .n-tree {
      height: 13rem;
      // overflow-y: auto;
      width: 100%;
      overflow-x: auto;

      :deep(.n-tree-node-wrapper) {
        white-space: nowrap;
      }

      :deep(.n-tree-node-content__text) {
        flex-grow: unset;
      }
    }
  }

  .n-form {
    margin-top: 0.5rem;

    :deep(.n-form-item-feedback-wrapper) {
      min-height: 0.25rem;
    }

    .n-upload {
      // margin-left: 1rem;
      margin-bottom: 0.5rem;
    }
  }
}
</style>
