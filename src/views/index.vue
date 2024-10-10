<template>
  <router-view></router-view>
</template>

<script setup lang="ts">
import {useMessage, useNotification, useDialog, useModal,useLoadingBar} from "naive-ui";

//反馈组件注册至全局
window.$message = useMessage();
window.$dialog = useDialog();
window.$modal = useModal();
window.$loadingBar = useLoadingBar();
window.$notification = useNotification();
</script>

<style scoped lang="less">

</style>