<script setup lang="ts">
import { NConfigProvider,darkTheme } from "naive-ui";
import { ref,provide } from 'vue';

const theme:any = (!localStorage.getItem("theme") || localStorage.getItem("theme") === 'default') ? ref(null) : ref(darkTheme);
const set_theme = (data:string) => {
    theme.value = data === 'darkTheme' ? darkTheme : null;
    localStorage.setItem("theme",data);
}

provide("theme",theme.value === null ? 'default' : 'darkTheme');
provide('set_theme',set_theme);
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
