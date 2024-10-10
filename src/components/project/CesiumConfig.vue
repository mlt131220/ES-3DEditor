<script setup lang="ts">
import {reactive, ref} from "vue";
import {FormInst} from "naive-ui";
import {t} from "@/language";
import {CESIUM_DEFAULT_MAP, CESIUM_DEFAULT_MAP_TYPE} from "@/config/cesium";

const formRef = ref<FormInst | null>(null);
const form = reactive({
  token: "",
  map: "Amap",
  mapType: "satellite",
  markMap: true
})
const rules = {
  token: {required: true, message: t("cesium['Please Enter Cesium Token']"), trigger: ['input', 'blur']}
}

function getData(){
  return {...form};
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
  <n-form :model="form" :rules="rules" label-placement="left" label-align="left" label-width="120" size="small" ref="formRef">
    <!-- cesium token  -->
    <n-form-item label="Cesium Token" path="token">
      <n-input v-model:value="form.token" :placeholder="t('cesium.Please Enter Cesium Token')" />
    </n-form-item>

    <!-- 默认底图  -->
    <n-form-item :label="t('cesium.Default base map')">
      <n-select v-model:value="form.map" :options="CESIUM_DEFAULT_MAP" />
    </n-form-item>

    <!-- 默认底图类型  -->
    <n-form-item :label="t('cesium.Base map type')">
      <n-select v-model:value="form.mapType" :options="CESIUM_DEFAULT_MAP_TYPE" />
    </n-form-item>

    <n-form-item label=" " v-if="form.mapType === 'satellite'">
      <n-checkbox v-model:checked="form.markMap">
        {{ t('cesium.Mark map') }}
      </n-checkbox>
    </n-form-item>
  </n-form>
</template>

<style scoped lang="less">

</style>