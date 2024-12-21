<script setup lang="ts">
import {t} from "@/language";

const props = withDefaults(defineProps<{
  visible: boolean,
  detail: ISceneFetchData
}>(), {
  visible: false,
  detail: () => ({
    id:"",
    sceneType:"",
    sceneName:"",
    sceneIntroduction:"",
    sceneVersion: 0,
    projectType: 0,
    coverPicture:"",
    hasDrawing: 0,
    zip:"",
    zipSize:"",
    createTime:"",
    updateTime:""
  })
})
const emits = defineEmits(['update:visible']);
</script>

<template>
  <n-modal :show="visible" @update:show="(v) => emits('update:visible',v)">
    <n-descriptions label-placement="left" bordered :column="1">
      <n-descriptions-item :label="t('scene.Cover Picture')">
        <n-image width="200" :src="detail.coverPicture || '/static/images/carousel/18.png'" />
      </n-descriptions-item>
      <n-descriptions-item label="ID">
        {{ detail.id }}
      </n-descriptions-item>
      <n-descriptions-item :label="t('scene.Name')">
        {{ detail.sceneName }}
      </n-descriptions-item>
      <n-descriptions-item :label="t('scene.Classification')">
        {{ detail.sceneType }}
      </n-descriptions-item>
      <n-descriptions-item :label="t('scene.Introduction')">
        {{ detail.sceneIntroduction }}
      </n-descriptions-item>
      <n-descriptions-item :label="t('other.Version')">
        {{ detail.sceneVersion }}
      </n-descriptions-item>
      <n-descriptions-item :label="t('scene.Project type')">
        {{ detail.projectType === 0 ? "Web3D" : "WebGIS" }}
      </n-descriptions-item>
      <n-descriptions-item :label="t('scene.Include drawings')">
        {{ detail.hasDrawing === 0 ? "No" : "Yes" }}
      </n-descriptions-item>
      <n-descriptions-item :label="t('scene.Scene data volume')">
        {{ detail.zipSize }}
      </n-descriptions-item>
      <n-descriptions-item :label="t('scene.Create time')">
        {{ detail.createTime.replace("T"," ").replace("+08:00","") }}
      </n-descriptions-item>
      <n-descriptions-item :label="t('scene.Update time')">
        {{ detail.updateTime.replace("T"," ").replace("+08:00","") }}
      </n-descriptions-item>
    </n-descriptions>
  </n-modal>
</template>

<style scoped lang="less">

</style>