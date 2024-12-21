<script lang="ts" setup>
import {ref,computed} from "vue";
import {t} from "@/language";
import {useSceneInfoStore} from "@/store/modules/sceneInfo";
import {SCENE_TYPE} from "@/utils/common/constant";

const sceneInfoStore = useSceneInfoStore();
const data = computed(() => sceneInfoStore.data);

function handleScreenshot(){
  Msy3D.Utils.getViewportImage(document.querySelector("#viewport canvas:first-child")).then(image => {
    sceneInfoStore.screenshot = image.src;
  })
}
</script>

<template>
  <n-form label-placement="left" :label-width="90" label-align="left" size="small">
    <!-- 场景名称 -->
    <n-form-item :label="t('scene.Name')">
      <n-input v-model:value="data.sceneName"
               :placeholder="t('layout.sider.project.please enter the scene name')"
               @change="(val)=>{sceneInfoStore.setDataFieldValue('sceneName',val)}"/>
    </n-form-item>

    <!-- 场景分类 -->
    <n-form-item :label="t('scene.Classification')">
      <n-select v-model:value="data.sceneType" filterable tag :options="SCENE_TYPE"
                @update:value="(val)=>{sceneInfoStore.setDataFieldValue('sceneType',val)}" />
    </n-form-item>

    <!-- 场景描述 -->
    <n-form-item :label="t('scene.Introduction')">
      <n-input v-model:value="data.sceneIntroduction" type="textarea"
               :placeholder="t('layout.sider.project[\'please enter the scene introduction\']')"
               :autosize="{ minRows: 2 }" @change="(val)=>{sceneInfoStore.setDataFieldValue('sceneIntroduction',val)}"/>
    </n-form-item>

    <!-- 场景版本 -->
    <n-form-item :label="t('other.Version')">
      <n-input-number v-model:value="data.sceneVersion" button-placement="both" class="text-center"
                      @update:value="(val)=>{sceneInfoStore.setDataFieldValue('sceneVersion',val)}"/>
    </n-form-item>

    <!-- 项目类型 -->
    <n-form-item :label="t('scene.Project type')">
      <n-tag type="success" :bordered="false">
        {{ data.projectType === 0 ? "Web3D" : "WebGIS" }}
      </n-tag>
    </n-form-item>

    <!--  封面图  -->
    <n-form-item :label="t('scene.Cover Picture')">
      <div class="w-full flex flex-col">
        <n-image :src="sceneInfoStore.screenshot" :alt="t('scene.Screenshot')" />
        <n-button @click="handleScreenshot">{{ t('scene.Screenshot') }}</n-button>
      </div>
    </n-form-item>
  </n-form>
</template>

<style scoped lang="less">
.n-image{
  :deep(img){
    width: 100%;
    border-radius: 4px;
    margin-bottom: 0.25rem;
  }
}
</style>
