<template>
  <div id="navigationOperation" class="flex items-center">
    <!--  撤回/重做  -->
    <Do />

    <!--  删除  -->
    <Delete />

    <!--  清空  -->
    <Clear />

    <!--  复制  -->
    <Copy />

    <!-- 全屏 -->
    <Fullscreen />

    <!--  导入/导出  -->
    <ImportExport />
  </div>
</template>

<script setup lang="ts">
import Fullscreen from "@/components/header/navigation/Fullscreen.vue";
import Do from "@/components/header/navigation/Do.vue";
import Copy from "@/components/header/navigation/Copy.vue";
import Delete from "@/components/header/navigation/Delete.vue";
import Clear from "@/components/header/navigation/Clear.vue";
import ImportExport from "@/components/header/navigation/ImportExport.vue";
</script>

<style scoped lang="less">

</style>