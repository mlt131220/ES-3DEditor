<template>
  <n-collapse display-directive="show" :default-expanded-names="['information','scene','video']">
    <template #arrow>
      <n-icon>
        <CaretForwardOutline />
      </n-icon>
    </template>
    <!--  工程信息  -->
    <n-collapse-item :title="t('layout.sider.sceneConfig[\'Project information\']')" name="information">
      <SidebarSceneProjectSetting class="px-2" />
    </n-collapse-item>
    <!--  场景配置  -->
    <n-collapse-item :title="t('layout.sider[\'Scene config\']')" name="scene">
      <SidebarSceneSetting class="px-2" />
    </n-collapse-item>
    <!--  视频录制  -->
<!--    <n-collapse-item :title="t('layout.sider.sceneConfig.Video')" name="video" v-if="videoIsShow">-->
<!--    </n-collapse-item>-->
  </n-collapse>
</template>

<script setup lang="ts">
import {ref} from "vue";
import {NCollapse, NCollapseItem} from "naive-ui";
import {CaretForwardOutline} from "@vicons/ionicons5";
import {t} from "@/language";
import SidebarSceneProjectSetting from "@/components/sidebar/sidebarScene/SidebarSceneProjectSetting.vue";
import SidebarSceneSetting from "@/components/sidebar/sidebarScene/SidebarSceneSetting.vue";
import {onMounted} from "vue";

//是否显示视频模块,默认false
const videoIsShow = ref(true);
onMounted(() => {
  if ('SharedArrayBuffer' in window) {
    videoIsShow.value = true;
  }
})
</script>

<style scoped lang="less">

</style>