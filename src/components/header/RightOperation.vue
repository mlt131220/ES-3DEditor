<script lang="ts" setup>
import {ref,onMounted} from 'vue';
import LocalSave from '@/components/header/right/LocalSave.vue';
import CodeOut from '@/components/header/right/CodeOut.vue';
import XR from '@/components/header/right/XR.vue';
import {useDispatchSignal} from "@/hooks/useSignal";
import Theme from "@/components/header/right/Theme.vue";
import Locale from "@/components/header/right/Locale.vue";
import Color from "@/components/header/right/Color.vue";

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
</script>

<template>
  <div id="rightOperation">
    <!--本地保存-->
    <LocalSave class="mr-2" />

    <!-- 出码 -->
    <CodeOut />

    <!-- XR -->
    <XR v-if="supportXr" />

    <!--  国际化  -->
    <Locale />

    <!--  主题  -->
    <Theme />

    <!--  主色调  -->
    <Color />
  </div>
</template>

<style lang="less" scoped>
#rightOperation {
  display: flex;
  align-items: center;
}
</style>