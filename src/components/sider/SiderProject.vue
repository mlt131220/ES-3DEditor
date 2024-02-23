<script lang="ts" setup>
import { inject, onMounted, ref } from 'vue';
import { NCollapse, NCollapseItem, NDivider } from 'naive-ui';
import SiderProjectSetting from './siderProject/SiderProjectSetting.vue';
import SiderProjectRender from './siderProject/SiderProjectRender.vue';
import SiderProjectMaterials from './siderProject/SiderProjectMaterials.vue';
import SiderProjectVideo from './siderProject/SiderProjectVideo.vue';
import {t} from "@/language";

//是否显示视频模块,默认false
const videoIsShow = ref(true);

onMounted(() => {
    if ('SharedArrayBuffer' in window) {
        videoIsShow.value = true;
    }
})
</script>

<template>
    <div id="project">
        <SiderProjectSetting />

        <n-divider dashed />

        <n-collapse display-directive="show" :default-expanded-names="['render', 'materials','video']">
            <n-collapse-item :title="t('layout.sider.project.renderer')" name="render" class="px-1">
                <SiderProjectRender />
            </n-collapse-item>
            <n-collapse-item :title="t('layout.sider.project.materials')" name="materials" class="px-1">
                <SiderProjectMaterials />
            </n-collapse-item>
            <n-collapse-item :title="t('layout.sider.project.video')" name="video" class="px-1" v-if="videoIsShow">
                <SiderProjectVideo />
            </n-collapse-item>
        </n-collapse>
    </div>
</template>
