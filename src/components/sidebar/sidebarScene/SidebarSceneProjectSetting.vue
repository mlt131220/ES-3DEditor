<script lang="ts" setup>
import {onMounted, onBeforeUnmount} from 'vue';
import {NForm, NFormItem, NInput} from 'naive-ui';
import {useAddSignal, useRemoveSignal} from "@/hooks/useSignal";
import {t} from "@/language";
import {useSceneInfoStore} from "@/store/modules/sceneInfo";
import {SCENE_TYPE} from "@/utils/common/constant";

const sceneInfoStore = useSceneInfoStore();

function handleEditorCleared() {
  sceneInfoStore.$reset();
}

onMounted(() => {
  useAddSignal("editorCleared", handleEditorCleared);
})
onBeforeUnmount(() => {
  useRemoveSignal("editorCleared", handleEditorCleared);
})
</script>

<template>
  <n-form label-placement="left" :label-width="90" label-align="left" size="small">
    <!-- 场景名称 -->
    <n-form-item :label="t('scene[\'Scene name\']')">
      <n-input :default-value="sceneInfoStore.getName"
               :placeholder="t('layout.sider.project[\'please enter the scene name\']')"
               @change="(val)=>{sceneInfoStore.setName(val)}"/>
    </n-form-item>
    <!-- 场景分类 -->
    <n-form-item :label="t('scene[\'Scene classification\']')">
      <n-select :default-value="sceneInfoStore.getType" filterable tag :options="SCENE_TYPE"
                @update:value="(val)=>{sceneInfoStore.setType(val)}" />
    </n-form-item>
    <!-- 场景描述 -->
    <n-form-item :label="t('scene[\'Scene introduction\']')">
      <n-input :default-value="sceneInfoStore.getIntroduction" type="textarea"
               :placeholder="t('layout.sider.project[\'please enter the scene introduction\']')"
               :autosize="{ minRows: 2 }" @change="(val)=>{sceneInfoStore.setIntroduction(val)}"/>
    </n-form-item>
    <!-- 场景版本 -->
    <n-form-item :label="t('other.Version')">
      <n-input-number :default-value="sceneInfoStore.getVersion" button-placement="both" class="text-center"
                      @update:value="(val)=>{sceneInfoStore.setVersion(val)}"/>
    </n-form-item>
  </n-form>
</template>
