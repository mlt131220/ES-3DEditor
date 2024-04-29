<script lang="ts" setup>
import {h, computed, onMounted} from 'vue';
import {
  FileRegular as File,
  Link as Help,
  Mixcloud
} from '@vicons/fa';
import {renderIcon} from "@/utils/common/render";
import NavigationOperation from '@/components/header/NavigationOperation.vue';
import RightOperation from '@/components/header/RightOperation.vue';
import {MenubarFile} from "@/utils/menubar/menubar-file";
import {MenubarNetwork} from "@/utils/menubar/menubar-network";
import {t} from "@/language";

let menubarFile, menubarNetwork;

onMounted(() => {
  menubarFile = new MenubarFile();
  menubarNetwork = new MenubarNetwork();
})

const menuOptions = computed(() => {
  return [
    {
      label: t("layout.header.File"),
      key: 'tools-files',
      icon: renderIcon(File),
      children: [
        {
          label: t("layout.header['New THREEJS Scene']"),
          key: "tools-files-reCreate"
        },
        {
          label: t("layout.header['New Cesium Fusion Scene']") + `(${t("other['Under development']")})`,
          key: "tools-files-newCesium"
        },
        {
          type: 'group',
          label: t("layout.header.Import"),
          key: 'import',
          children: [
            { //导入json
              label: t("layout.header.Import"),
              key: "tools-files-import"
            },
            { //导入zip包
              label: t("layout.header['Import Zip']"),
              key: "tools-files-importZip"
            }
          ]
        },
        {
          type: 'group',
          label: t("layout.header.Export"),
          key: 'export',
          children: [
            {
              label: t("layout.header['Export Geometry']"),
              key: "tools-files-exportGeometry"
            },
            {
              label: t("layout.header['Export Object']"),
              key: "tools-files-exportObject"
            },
            {
              label: t("layout.header['Export Scene']"),
              key: "tools-files-exportScene"
            },
            {
              label: t("layout.header['Export Format']"),
              key: "tools-files-exportFormat",
              children: [
                {
                  label: "DAE",
                  key: "tools-files-exportDae"
                },
                {
                  label: "GLB",
                  key: "tools-files-exportGlb"
                },
                {
                  label: "GLTF",
                  key: "tools-files-exportGltf"
                },
                {
                  label: "OBJ",
                  key: "tools-files-exportObj"
                },
                {
                  label: "PLY",
                  key: "tools-files-exportPly"
                },
                {
                  label: t("layout.header['PLY (Binary)']"),
                  key: "tools-files-exportPlyBinary"
                },
                {
                  label: "STL",
                  key: "tools-files-exportStl"
                },
                {
                  label: t("layout.header['STL (Binary)']"),
                  key: "tools-files-exportStlBinary"
                },
                {
                  label: "USDZ",
                  key: "tools-files-exportUSDZ"
                },
              ]
            },
          ]
        }
      ]
    },
    {
      label: t("layout.header.Network"),
      key: 'tools-network',
      icon: renderIcon(Mixcloud),
      children: [
        {//从服务器获取工程
          label: t("layout.header['Get The Project From The Server']"),
          key: "tools-network-getProjectForServer"
        },
        {//作为新工程保存至服务器
          label: t("layout.header['Save To The Server As A New Project']"),
          key: "tools-network-saveNewProjectToServer"
        },
        {//更新工程至服务器
          // label: t("layout.header['Update Project To Server']") + "(loading)",
          label: t("layout.header['Update Project To Server']"),
          key: "tools-network-updateProjectToServer"
        }
      ]
    },
    {
      label: t("layout.header.Help"),
      key: 'tools-help',
      icon: renderIcon(Help),
      children: [
        {
          label: () => h('a', {
            href: "//editor-doc.mhbdng.cn",
            target: '_blank'
          }, t("layout.header.Document")),
          key: 'tools-help-doc',
        },
        {
          label: () => h('a', {
            href: "https://github.com/mlt131220",
            target: '_blank'
          }, t("layout.header['Author GitHub']")),
          key: 'tools-help-author-github',
        },
        {
          label: () => h('a', {
            href: "https://github.com/mlt131220/Vue3-ThreeJSEditor",
            target: '_blank'
          }, t("layout.header['Project Link']")),
          key: 'tools-help-vue3-threejs-editor-git-link',
        }
      ]
    }
  ]
});

function handlerMenuSelect(key: string) {
  const keyArr = key.split("-");
  switch (keyArr[1]) {
    case "files":
      menubarFile.init(keyArr[2]);
      break;
    case 'network':
      menubarNetwork.init(keyArr[2]);
      break;
  }
}
</script>

<template>
  <div class="flex items-center">
    <img src="/static/images/logo/logo.svg" alt="logo" class="w-40px h-40px">

    <n-menu mode="horizontal" dropdown-placement="top-start" :options="menuOptions"
            @update:value="handlerMenuSelect"/>
  </div>

  <NavigationOperation />

  <RightOperation />
</template>

<style lang="less" scoped>
.n-menu.n-menu--horizontal {
  width: auto;

  :deep(.n-menu-item-content) {
    padding: 0 0.5rem;
  }
}
</style>
