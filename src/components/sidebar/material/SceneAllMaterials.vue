<script lang="ts" setup>
import {onMounted, ref} from 'vue';
import {NButton, NCollapse, NCollapseItem, NSelect} from 'naive-ui';
import {CaretForwardOutline} from "@vicons/ionicons5";
import {t} from "@/language";
import {useAddSignal} from "@/hooks/useSignal";
import {SetMaterialCommand} from '@/core/commands/SetMaterialCommand';

const selectMaterial = ref();
const materialOptions = ref<{}[]>([]);

onMounted(() => {
  signalAdd();
})

function refreshMaterialBrowserUI() {
  materialOptions.value = Object.values(window.editor.materials).map((item: any) => {
    return {
      label: item.name,
      value: item
    }
  });
}

function signalAdd() {
  useAddSignal("objectSelected", (object) => {
    if (object !== null) {
      const arr = Object.values(window.editor.materials);
      const index = arr.indexOf(object.material);
      selectMaterial.value = arr[index];
    }
  });
  useAddSignal("materialAdded", refreshMaterialBrowserUI);
  useAddSignal("materialChanged", refreshMaterialBrowserUI);
  useAddSignal("materialRemoved", refreshMaterialBrowserUI);
}

//应用材质
function assignMaterial() {
  const selectedObject = window.editor.selected;
  if (selectedObject === null) return;

  const oldMaterial = selectedObject.material;
  //仅将材质指定给具有材质特性的对象(例如，避免将材质指定给THREE.Group)
  if (!oldMaterial) return;
  const material = window.editor.getMaterialById(parseInt(selectMaterial.value.id));

  if (!material) return;
  window.editor.removeMaterial(oldMaterial);
  window.editor.execute(new SetMaterialCommand(selectedObject, material));
  window.editor.addMaterial(material);
}
</script>

<template>
  <n-collapse display-directive="show" :default-expanded-names="['material']">
    <template #arrow>
      <n-icon>
        <CaretForwardOutline />
      </n-icon>
    </template>

    <!--  选择材质  -->
    <n-collapse-item :title="t('layout.sider.project[\'select material\']')" name="material">
      <div class="flex justify-between">
        <n-select v-model:value="selectMaterial" filterable size="small"
                  :placeholder="t('layout.sider.project[\'select material\']')" :options="materialOptions"/>

        <n-button type="primary" size="small" class="ml-5px" @click="assignMaterial">
          {{ t('layout.sider.project.assign') }}
        </n-button>
      </div>
    </n-collapse-item>
  </n-collapse>

  <n-divider />
</template>
