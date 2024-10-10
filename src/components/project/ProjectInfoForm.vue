<script lang="ts" setup>
import {ref, watch, toRaw, reactive} from "vue";
import {t} from "@/language";
import {DefaultSceneData} from "@/store/modules/sceneInfo";
import {SCENE_TYPE} from "@/utils/common/constant";

const props = withDefaults(defineProps<{
  value:ISceneFetchData | null
}>(),{
  value:null
})

const formRef = ref();
const form = ref<ISceneFetchData>({...DefaultSceneData});
const rules = {
  sceneName: {required: true, message: t("layout.sider.project.please enter the scene name"), trigger: ['input', 'blur']}
}

watch(() => props.value,(newVal) => {
  if(newVal === null){
    Object.keys(DefaultSceneData).forEach(key => {
      form.value[key] = DefaultSceneData[key];
    })
  }else{
    Object.keys(newVal).forEach(key => {
      form.value[key] = newVal[key];
    })
  }
})

function getData():ISceneFetchData{
  return {...form.value};
}

function validate(){
  return new Promise((resolve,reject) => {
    formRef.value?.validate((errors) => {
      if (!errors) {
        resolve('')
      }
      else {
        reject(errors)
      }
    })
  })

}

defineExpose({
  getData,validate
})
</script>

<template>
  <n-form ref="formRef" :model="form" :rules="rules" size="small" class="max-w-100%"
      label-placement="left" label-width="100">
    <!-- 场景名称 -->
    <n-form-item :label="t('scene.Name')" path="sceneName">
      <n-input v-model:value="form.sceneName"
               :placeholder="t('layout.sider.project.please enter the scene name')" />
    </n-form-item>

    <!-- 场景分类 -->
    <n-form-item :label="t('scene.Classification')">
      <n-select v-model:value="form.sceneType" filterable tag :options="SCENE_TYPE" />
    </n-form-item>

    <!-- 场景描述 -->
    <n-form-item :label="t('scene.Introduction')">
      <n-input v-model:value="form.sceneIntroduction" type="textarea"
               :placeholder="t('layout.sider.project[\'please enter the scene introduction\']')" />
    </n-form-item>

    <!-- 场景版本 -->
    <n-form-item :label="t('other.Version')">
      <n-input-number v-model:value="form.sceneVersion" button-placement="both" class="text-center" />
    </n-form-item>
  </n-form>
</template>

<style scoped lang="less">
</style>
