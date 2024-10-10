<script lang="ts" setup>
import {ref,onMounted} from 'vue';
import XR from '@/components/header/right/XR.vue';
import {useDispatchSignal} from "@/hooks/useSignal";
import CommonSetting from "@/components/setting/CommonSetting.vue";
import SaveToService from "@/components/header/right/SaveToService.vue";
import {t} from "@/language";
import {Airplay} from "@vicons/carbon";
import {useSceneInfoStore} from "@/store/modules/sceneInfo";

const sceneInfoStore = useSceneInfoStore();

const supportXr = ref(false);

onMounted(() => {
  // 判断是否支持XR
  if (navigator.xr) {
    if ('offerSession' in navigator.xr) {
      useDispatchSignal("offerXR",'immersive-ar');
    }else{
      supportXr.value = true;
    }
  }else{
    supportXr.value = false;
  }
});

function handlePreview(){
  // 新窗口打开
  window.open(window.location.origin + "/#/preview/" + sceneInfoStore.data.id, "_blank");
}
</script>

<template>
  <div id="rightOperation">
    <!--  保存至服务器  -->
    <SaveToService class="mr-2" />

    <!-- 预览 -->
    <n-button @click="handlePreview">
      <template #icon>
        <n-icon><Airplay /></n-icon>
      </template>
      {{ t("home.Preview") }}
    </n-button>

    <!-- XR -->
    <XR v-if="supportXr" />

    <!--  通用配置项  -->
    <CommonSetting />
  </div>
</template>

<style lang="less" scoped>
#rightOperation {
  display: flex;
  align-items: center;
}
</style>