<template>
  <n-dropdown
      :options="exportOptions"
      placement="bottom-start"
      trigger="click"
      @select="handleExportSelect"
  >
    <n-button class="mr-2">
      <template #icon>
        <n-icon size="22">
          <DocumentExport/>
        </n-icon>
      </template>
      {{ t("layout.header.Export") }}
    </n-button>
  </n-dropdown>

  <n-button type="primary" @click="handleImport">
    <template #icon>
      <n-icon>
        <DocumentImport />
      </n-icon>
    </template>
    {{t("layout.header.Import") }}
  </n-button>
</template>

<script setup lang="ts">
import {onMounted} from "vue";
import {DocumentImport, DocumentExport} from "@vicons/carbon";
import {t} from "@/language";
import {Export} from "@/core/exporters/export";

const exportClass = new Export();

const exportOptions = [
  {
    label: t("layout.header['Export Geometry']"),
    key: "exportGeometry"
  },
  {
    label: t("layout.header['Export Object']"),
    key: "exportObject"
  },
  {
    label: t("layout.header['Export Scene']"),
    key: "exportScene"
  },
  {
    type: 'divider',
    key: 'd1'
  },
  {
    label: t("layout.header['Export Format']"),
    key: "exportFormat",
    children:[
      {
        label: "DAE",
        key: "exportDae"
      },
      {
        label: "GLB",
        key: "exportGlb"
      },
      {
        label: "GLTF",
        key: "exportGltf"
      },
      {
        label: "OBJ",
        key: "exportObj"
      },
      {
        label: "PLY",
        key: "exportPly"
      },
      {
        label: t("layout.header['PLY (Binary)']"),
        key: "exportPlyBinary"
      },
      {
        label: "STL",
        key: "exportStl"
      },
      {
        label: t("layout.header['STL (Binary)']"),
        key: "exportStlBinary"
      },
      {
        label: "USDZ",
        key: "exportUSDZ"
      }
    ]
  }
]

function handleImport() {
  const form = document.createElement('form');
  form.style.display = 'none';
  document.body.appendChild(form);

  const fileInput = document.createElement('input');
  fileInput.multiple = true;
  fileInput.type = 'file';
  fileInput.addEventListener('change', function () {
    window.editor.loader.loadFiles(fileInput.files, undefined, () => {
      form.reset();
    });
  });
  form.appendChild(fileInput);

  fileInput.click();
}

function handleExportSelect(key: string){
  exportClass.init(key);
}

onMounted(() => {
})
</script>

<style scoped lang="less">

</style>