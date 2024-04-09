<script lang="ts" setup>
import {h, ref, computed, onMounted} from 'vue';
import {NMenu, NGradientText} from 'naive-ui';
import {
  FileRegular as File,
  EditRegular as Edit,
  Link as Help,
  Mixcloud
} from '@vicons/fa';
import {renderIcon} from "@/utils/common/render";
import RightOperation from '@/components/header/RightOperation.vue';
import {MenubarFile} from "@/utils/menubar/menubar-file";
import {MenubarEdit} from '@/utils/menubar/menubar-edit';
import {MenubarNetwork} from "@/utils/menubar/menubar-network";
import {useAddSignal} from "@/hooks/useSignal";
import {t} from "@/language";

let menubarFile, menubarEdit, menubarNetwork;
const undoDisabled = ref(true);
const redoDisabled = ref(true);
const title = ref(import.meta.env.VITE_GLOB_APP_TITLE);

function historyChanged() {
  undoDisabled.value = window.editor.history.undos.length === 0;
  redoDisabled.value = window.editor.history.redos.length === 0;
}

onMounted(() => {
  menubarFile = new MenubarFile();
  menubarEdit = new MenubarEdit();
  menubarNetwork = new MenubarNetwork();

  useAddSignal("historyChanged", historyChanged);

  historyChanged();
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
      label: t("layout.header.Edit"),
      key: 'tools-edit',
      icon: renderIcon(Edit),
      children: [
        {
          label: t("layout.header['Undo(Ctrl+Z)']"),
          key: 'tools-edit-undo',
          disabled: undoDisabled.value
        },
        {
          label: t("layout.header['Redo(Ctrl+Y)']"),
          key: 'tools-edit-redo',
          disabled: redoDisabled.value
        },
        {
          label: t("layout.header['Clear History']"),
          key: 'tools-edit-clearHistory'
        },
        {
          label: t("layout.header.Center"),
          key: 'tools-edit-center'
        },
        {
          label: t("layout.header.Clone"),
          key: 'tools-edit-clone'
        },
        {
          label: t("layout.header['Delete(Del)']"),
          key: 'tools-edit-delete'
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
    case "edit":
      menubarEdit.init(keyArr[2]);
      break;
  }
}
</script>

<template>
  <n-gradient-text :size="24" type="success">{{ title }}</n-gradient-text>

  <n-menu value="" mode="horizontal" dropdown-placement="top-start" :options="menuOptions"
          @update:value="handlerMenuSelect"/>

  <RightOperation/>
</template>

<style lang="less" scoped>
.n-menu.n-menu--horizontal {
  :deep(.n-menu-item-content) {
    padding: 0 0.5rem;
  }
}
</style>
