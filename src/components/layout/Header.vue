<script lang="ts" setup>
import { h, ref } from 'vue'
import { NIcon, NMenu, NSwitch, NGradientText,NPopover } from 'naive-ui'
import {
  FileRegular as File,
  EditRegular as Edit,
  Plus as Add,
  Link as Help
} from '@vicons/fa'

function renderIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions = ref([
  {
    label: "文件",
    key: 'tools-files',
    icon: renderIcon(File),
    children: [
      {
        label: "新建(loading)",
        key: "tools-files-new"
      },
      {
        label: "导入(loading)",
        key: "tools-files-import"
      },
      {
        label: "导出几何体(loading)",
        key: "tools-files-export-geometry"
      },
      {
        label: "导出物体(loading)",
        key: "tools-files-export-object"
      },
      {
        label: "导出场景(loading)",
        key: "tools-files-export-scene"
      },
      {
        label: "导出DAE(loading)",
        key: "tools-files-export-dae"
      },
      {
        label: "导出DRC(loading)",
        key: "tools-files-export-drc"
      },
      {
        label: "导出GLB(loading)",
        key: "tools-files-export-glb"
      },
      {
        label: "导出GLTF(loading)",
        key: "tools-files-export-gltf"
      },
      {
        label: "导出OBJ(loading)",
        key: "tools-files-export-obj"
      },
      {
        label: "导出PLY(loading)",
        key: "tools-files-export-ply"
      },
      {
        label: "导出PLY(二进制)(loading)",
        key: "tools-files-export-ply-binary"
      },
      {
        label: "导出STL(loading)",
        key: "tools-files-export-stl"
      },
      {
        label: "导出STL(二进制)(loading)",
        key: "tools-files-export-stl-binary"
      },
      {
        label: "发布(loading)",
        key: "tools-files-release"
      },
      {
        label: "保存所选源模型(loading)",
        key: "tools-files-save-select-model"
      },
      {
        label: "更新源模型(loading)",
        key: "tools-files-update-model"
      },
      {
        label: "从服务器获取源模型(loading)",
        key: "tools-files-get-model-for-server"
      },
      {
        label: "作为新工程保存至服务器(loading)",
        key: "tools-files-save-new-project-to-server"
      },
      {
        label: "从服务器获取工程(loading)",
        key: "tools-files-get-project-for-server"
      },
      {
        label: "更新工程至服务器(loading)",
        key: "tools-files-update-project-to-server"
      }
    ]
  },
  {
    label: '编辑',
    key: 'tools-edit',
    icon: renderIcon(Edit),
    children: [
      {
        label: '撤销(Ctrl+Z)(loading)',
        key: 'tools-edit-undo'
      },
      {
        label: '重做(Ctrl+Y)(loading)',
        key: 'tools-edit-redo',
        disabled: true
      },
      {
        label: '清空历史记录(loading)',
        key: 'tools-edit-clear-history'
      },
      {
        label: '拷贝(loading)',
        key: 'tools-edit-copy'
      },
      {
        label: '删除(Del)(loading)',
        key: 'tools-edit-delete'
      },
      {
        label: '修复颜色贴图(loading)',
        key: 'tools-edit-fix-color-maps'
      },
    ]
  },
  {
    label: '添加',
    key: 'tools-add',
    icon: renderIcon(Add),
    children: [
      {
        label: "组(loading)",
        key: "tools-add-group"
      },
      {
        label: "正方体(loading)",
        key: "tools-add-box"
      },
      {
        label: "圆(loading)",
        key: "tools-add-circle"
      },
      {
        label: "圆柱体(loading)",
        key: "tools-add-cylinder"
      },
      {
        label: "十二面体(loading)",
        key: "tools-add-dodecahedron"
      },
      {
        label: "二十面体(loading)",
        key: "tools-add-icosahedron"
      },
      {
        label: "酒杯(loading)",
        key: "tools-add-lathe"
      },
      {
        label: "八面体(loading)",
        key: "tools-add-octahedron"
      },
      {
        label: "平面(loading)",
        key: "tools-add-plane"
      },
      {
        label: "环(loading)",
        key: "tools-add-ring"
      },
      {
        label: "球体(loading)",
        key: "tools-add-sphere"
      },
      {
        label: "精灵(loading)",
        key: "tools-add-sprite"
      },
      {
        label: "四面体(loading)",
        key: "tools-add-tetrahedron"
      },
      {
        label: "圆环体(loading)",
        key: "tools-add-torus"
      },
      {
        label: "环面扭结体(loading)",
        key: "tools-add-torusKnot"
      },
      {
        label: "管(loading)",
        key: "tools-add-tube"
      },
      {
        label: "管(loading)",
        key: "tools-add-tube"
      },
      {
        label: "环境光(loading)",
        key: "tools-add-ambientlight"
      },
      {
        label: "平行光(loading)",
        key: "tools-add-directionallight"
      },
      {
        label: "半球光(loading)",
        key: "tools-add-hemispherelight"
      },
      {
        label: "点光源(loading)",
        key: "tools-add-pointlight"
      },
      {
        label: "聚光灯(loading)",
        key: "tools-add-spotlight"
      },
      {
        label: "正交相机(loading)",
        key: "tools-add-orthographic-camera"
      },
      {
        label: "透视相机(loading)",
        key: "tools-add-perspective-camera"
      }
    ]
  },
  {
    label: '帮助',
    key: 'tools-help',
    icon: renderIcon(Help),
    children: [
      {
        label: () => h("a", { href: "https://threejs.org/docs/", target: "_blank" }, "three.js文档"),
        key: 'tools-help-threejs-docs',
      },
      {
        label: () => h('a', { href: "http://www.yanhuangxueyuan.com/Three.js/", target: '_blank' }, 'three.js电子书'),
        key: 'tools-help-threejs-e-books',
      },
      {
        label: () => h('a', { href: "https://github.com/mlt131220", target: '_blank' }, '作者GitHub'),
        key: 'tools-help-author-github',
      },
      {
        label: () => h('a', { href: "https://github.com/mlt131220/Vue3-ThreeJSEditor", target: '_blank' }, '本项目地址'),
        key: 'tools-help-vue3-threejs-editor-git-link',
      }
    ]
  }
])

const activeKey = ref(null);
const switchActive = ref(false);
const switchChange = (value: boolean) => {
  console.log(`Update value: ${value}`)
}
</script>

<template>
  <n-popover trigger="hover">
    <template #trigger>
      <n-gradient-text :size="24" type="success">ThreeJS Editor</n-gradient-text>
    </template>
    <span>ThreeJS Editor For Vue3.2</span>
  </n-popover>

  <n-menu v-model:value="activeKey" mode="horizontal" dropdown-placement="top-start" :options="menuOptions" />

  <n-switch v-model:value="switchActive" @update:value="switchChange">
    <template #checked>自动保存</template>
    <template #unchecked>自动保存</template>
  </n-switch>
  <n-gradient-text class="gradient-text" type="success">r132</n-gradient-text>
</template>

<style lang="scss" scoped>
.n-menu.n-menu--horizontal {
  :deep(.n-menu-item-content) {
    padding: 0 10px;
  }
}
.n-switch,
.gradient-text {
  position: absolute;
  right: 10px;
}
.n-switch {
  right: 60px;
  top: 10px;
}
</style>
