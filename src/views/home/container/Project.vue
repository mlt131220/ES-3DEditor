<script setup lang="ts">
import {t} from "@/language";
import HeaderCarousel from "@/views/home/components/HeaderCarousel.vue";
import MyProject from "@/views/home/project/MyProject.vue";
import SharedProject from "@/views/home/project/SharedProject.vue";

</script>

<template>
  <n-layout-header>
    <HeaderCarousel/>
  </n-layout-header>

  <n-layout-content content-style="padding: 24px;">
    <n-tabs type="line" animated default-value="shared-project" class="h-full">
      <n-tab-pane name="my-project" :tab="t('home.My Project')" disabled>
        <MyProject />
      </n-tab-pane>
      <n-tab-pane name="shared-project" :tab="t('home.Shared Project')">
        <SharedProject />
      </n-tab-pane>
    </n-tabs>
  </n-layout-content>
</template>

<style scoped lang="less">
.n-layout-content{
  height: calc(75vh - var(--header-height));

  :deep(.n-tabs-pane-wrapper){
    height: 100%;
  }

  .n-tab-pane{
    height: 100%;
  }
}
</style>