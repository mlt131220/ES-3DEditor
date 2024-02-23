<script lang="ts" setup>
import { ref, inject,onMounted } from 'vue';
import {  NSwitch, NGradientText } from 'naive-ui';
import {useAddSignal,useDispatchSignal} from "@/hooks/useSignal";
import {t} from "@/language";

const autosave = ref(false);
const autosaveChange = (value: boolean) => {
  window.editor.config.setKey('autosave',value);

  if(value){
    useDispatchSignal("sceneGraphChanged");
  }
}

const loading = ref(false);
useAddSignal("savingStarted",()=>{
    loading.value = true;
})
useAddSignal("savingFinished",()=>{
    loading.value = false;
})

onMounted(()=>{
  autosave.value = window.editor.config.getKey('autosave');
})
</script>

<template>
    <n-switch :loading="loading" v-model:value="autosave" @update:value="autosaveChange">
        <template #checked>{{ t("layout.header.Autosave") }}</template>
        <template #unchecked>{{ t("layout.header.Autosave") }}</template>
    </n-switch>
<!--    <n-gradient-text class="gradient-text" type="success">r147</n-gradient-text>-->
</template>

<style lang="less" scoped>
.n-switch {
  margin-right: 0.5rem;
}
</style>
