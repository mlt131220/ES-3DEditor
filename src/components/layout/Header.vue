<script lang="ts" setup>
import { h, ref,inject } from 'vue'
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

const t:any = inject("t");
const menuOptions = ref([
  {
    label: t("layout.header.File"),
    key: 'tools-files',
    icon: renderIcon(File),
    children: [
      {
        label: t("layout.header.New") +"(loading)",
        key: "tools-files-new"
      },
      {
        label: t("layout.header.Import") +"(loading)",
        key: "tools-files-import"
      },
      {
        label: t("layout.header['Export Geometry']") + "(loading)",
        key: "tools-files-export-geometry"
      },
      {
        label: t("layout.header['Export Object']") + "(loading)",
        key: "tools-files-export-object"
      },
      {
        label: t("layout.header['Export Scene']") + "(loading)",
        key: "tools-files-export-scene"
      },
      {
        label: t("layout.header['Export DAE']") + "(loading)",
        key: "tools-files-export-dae"
      },
      {
        label: t("layout.header['Export DRC']") + "(loading)",
        key: "tools-files-export-drc"
      },
      {
        label: t("layout.header['Export GLB']") + "(loading)",
        key: "tools-files-export-glb"
      },
      {
        label: t("layout.header['Export GLTF']") + "(loading)",
        key: "tools-files-export-gltf"
      },
      {
        label: t("layout.header['Export OBJ']") + "(loading)",
        key: "tools-files-export-obj"
      },
      {
        label: t("layout.header['Export PLY']") + "(loading)",
        key: "tools-files-export-ply"
      },
      {
        label: t("layout.header['Export PLY (Binary)']") + "(loading)",
        key: "tools-files-export-ply-binary"
      },
      {
        label: t("layout.header['Export STL']") + "(loading)",
        key: "tools-files-export-stl"
      },
      {
        label: t("layout.header['Export STL (Binary)']") + "(loading)",
        key: "tools-files-export-stl-binary"
      },
      {
        label: t("layout.header.Publish") + "(loading)",
        key: "tools-files-release"
      },
      {
        label: t("layout.header['Save The Selected Source Model']") + "(loading)",
        key: "tools-files-save-select-model"
      },
      {
        label: t("layout.header['Update Source Model']") + "(loading)",
        key: "tools-files-update-model"
      },
      {
        label: t("layout.header['Get The Source Model From The Server']") + "(loading)",
        key: "tools-files-get-model-for-server"
      },
      {
        label: t("layout.header['Save To The Server As A New Project']") + "(loading)",
        key: "tools-files-save-new-project-to-server"
      },
      {
        label: t("layout.header['Get The Peoject From The Server']") + "(loading)",
        key: "tools-files-get-project-for-server"
      },
      {
        label: t("layout.header['Update Project To Server']") + "(loading)",
        key: "tools-files-update-project-to-server"
      }
    ]
  },
  {
    label: t("layout.header.Edit"),
    key: 'tools-edit',
    icon: renderIcon(Edit),
    children: [
      {
        label: t("layout.header['Undo(Ctrl+Z)']") + '(loading)',
        key: 'tools-edit-undo'
      },
      {
        label: t("layout.header['Redo(Ctrl+Y)']") + '(loading)',
        key: 'tools-edit-redo',
        disabled: true
      },
      {
        label: t("layout.header['Clear History']") + '(loading)',
        key: 'tools-edit-clear-history'
      },
      {
        label:  t("layout.header.Clone") + '(loading)',
        key: 'tools-edit-copy'
      },
      {
        label: t("layout.header['Delete(Del)']") + '(loading)',
        key: 'tools-edit-delete'
      },
      {
        label: t("layout.header['Fix Color Maps]") + '(loading)',
        key: 'tools-edit-fix-color-maps'
      },
    ]
  },
  {
    label: t("layout.header.Add"),
    key: 'tools-add',
    icon: renderIcon(Add),
    children: [
      {
        label: t("layout.header.Group") + "(loading)",
        key: "tools-add-group"
      },
      {
        label: t("layout.header.Box") + "(loading)",
        key: "tools-add-box"
      },
      {
        label: t("layout.header.Circle") + "(loading)",
        key: "tools-add-circle"
      },
      {
        label: t("layout.header.Cylinder") + "(loading)",
        key: "tools-add-cylinder"
      },
      {
        label: t("layout.header.Dodecahedron") + "(loading)",
        key: "tools-add-dodecahedron"
      },
      {
        label: t("layout.header.Icosahedron") + "(loading)",
        key: "tools-add-icosahedron"
      },
      {
        label: t("layout.header.Lathe") + "(loading)",
        key: "tools-add-lathe"
      },
      {
        label: t("layout.header.Octahedron") + "(loading)",
        key: "tools-add-octahedron"
      },
      {
        label: t("layout.header.Plane") + "(loading)",
        key: "tools-add-plane"
      },
      {
        label: t("layout.header.Ring") + "(loading)",
        key: "tools-add-ring"
      },
      {
        label: t("layout.header.Sphere") + "(loading)",
        key: "tools-add-sphere"
      },
      {
        label: t("layout.header.Sprite") + "(loading)",
        key: "tools-add-sprite"
      },
      {
        label: t("layout.header.Tetrahedron") + "(loading)",
        key: "tools-add-tetrahedron"
      },
      {
        label: t("layout.header.Torus") + "(loading)",
        key: "tools-add-torus"
      },
      {
        label: t("layout.header.TorusKnot") + "(loading)",
        key: "tools-add-torusKnot"
      },
      {
        label: t("layout.header.Tube") + "(loading)",
        key: "tools-add-tube"
      },
      {
        label: t("layout.header.AmbientLight") + "(loading)",
        key: "tools-add-ambientlight"
      },
      {
        label: t("layout.header.DirectionalLight") + "(loading)",
        key: "tools-add-directionallight"
      },
      {
        label: t("layout.header.HemisphereLight") + "(loading)",
        key: "tools-add-hemispherelight"
      },
      {
        label: t("layout.header.PointLight") + "(loading)",
        key: "tools-add-pointlight"
      },
      {
        label: t("layout.header.SpotLight") + "(loading)",
        key: "tools-add-spotlight"
      },
      {
        label: t("layout.header.OrthographicCamera") + "(loading)",
        key: "tools-add-orthographic-camera"
      },
      {
        label: t("layout.header.PerspectiveCamera") + "(loading)",
        key: "tools-add-perspective-camera"
      }
    ]
  },
  {
    label: t("layout.header.Help"),
    key: 'tools-help',
    icon: renderIcon(Help),
    children: [
      {
        label: () => h("a", { href: "https://threejs.org/docs/", target: "_blank" }, t("layout.header['Three.js Docs']")),
        key: 'tools-help-threejs-docs',
      },
      {
        label: () => h('a', { href: "http://www.yanhuangxueyuan.com/Three.js/", target: '_blank' }, t("layout.header['Threejs E Books']")),
        key: 'tools-help-threejs-e-books',
      },
      {
        label: () => h('a', { href: "https://github.com/mlt131220", target: '_blank' }, t("layout.header['Author GitHub']")),
        key: 'tools-help-author-github',
      },
      {
        label: () => h('a', { href: "https://github.com/mlt131220/Vue3-ThreeJSEditor", target: '_blank' }, t("layout.header['Project Link']")),
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
    <template #checked>{{t("layout.header.autosave")}}</template>
    <template #unchecked>{{t("layout.header.autosave")}}</template>
  </n-switch>
  <n-gradient-text class="gradient-text" type="success">r132</n-gradient-text>
</template>

<style lang="scss" scoped>
.n-menu.n-menu--horizontal {
  :deep(.n-menu-item-content) {
    padding: 0 0.5rem;
  }
}
.n-switch,
.gradient-text {
  position: absolute;
  right: 0.5rem;
}
.n-switch {
  right: 3rem;
}
</style>
