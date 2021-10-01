<script lang="ts" setup>
import {
    NLayout,
    NLayoutHeader,
    NLayoutSider,
    NLayoutContent,
    NLayoutFooter
} from "naive-ui";
import { ref } from 'vue'
import * as Layout from '../components/namespace/layout'

const siderWidth = ref(300);
</script>

<template>
    <div id="layout">
        <n-layout position="absolute">
            <n-layout-header bordered>
                <Layout.Header />
            </n-layout-header>
            <n-layout
                class="n-layout-center-layout"
                has-sider
                sider-placement="right"
                position="absolute"
            >
                <n-layout-content content-style="padding: 24px;">平山道</n-layout-content>
                <n-layout-sider
                    collapse-mode="width"
                    :collapsed-width="0"
                    :width="siderWidth"
                    :native-scrollbar="true"
                    show-trigger="arrow-circle"
                    bordered
                >
                    <Layout.Sider />
                </n-layout-sider>
            </n-layout>
            <n-layout-footer bordered position="absolute">
                <Layout.Footer />
            </n-layout-footer>
        </n-layout>
    </div>
</template>

<style lang="scss" scoped>
#layout {
    width: 100%;
    height: 100%;
    position: relative;

    .n-layout {
        &-header{
            height: 42px;
            line-height: 42px;
            position: relative;
            padding: 0 20px;
        }
        &-center-layout {
            top: 42px;
            bottom: 64px;
            width: 100%;
        }

        &-footer {
            height: 64px;
            line-height: 64px;
            padding: 0 24px;
        }
    }
}
</style>
