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
                <n-layout-content content-style="padding: 1.2rem;">平山道</n-layout-content>
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
            height: 2.1rem;
            line-height: 2.1rem;
            display: flex;
            padding: 0 1rem;
            align-items: center;
        }
        &-center-layout {
            top: 2.1rem;
            bottom: 3.2rem;
            width: 100%;
        }

        &-footer {
            height: 3.2rem;
            padding: 0 1rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
    }
}
</style>
