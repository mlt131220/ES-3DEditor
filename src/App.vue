<script setup lang="ts">
import { NConfigProvider,darkTheme } from "naive-ui";
import { ref,provide } from 'vue';
import GlobalConfig from "./config/global";

const theme:any = GlobalConfig.theme === 'default' ?  ref(null) : ref(darkTheme);
const SET_THEME = (data:string) => {
    theme.value = data === 'darkTheme' ? darkTheme : null;
    localStorage.setItem("theme",data);
}

provide("theme",GlobalConfig.theme);
provide('set_theme',SET_THEME);
</script>

<template>
<!-- 调整 naive-ui 的字重配置 -->
<n-config-provider  :theme="theme" :theme-overrides="{ common: { fontWeightStrong: '600' } }">
    <router-view></router-view>
</n-config-provider>
</template>

<style lang="scss" scoped>
.n-config-provider{
    width: 100%;
    height: 100%;
}
</style>
