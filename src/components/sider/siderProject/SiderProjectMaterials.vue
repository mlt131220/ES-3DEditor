<script lang="ts" setup>
import { inject, onMounted, ref } from 'vue';
import { useAddSignal } from "@/hooks/useSignal";
import { NButton, NSelect } from 'naive-ui';
import { SetMaterialCommand } from '@/core/commands/SetMaterialCommand';
import {t} from "@/language";

const selectMaterial = ref();
const materialOptions = ref<{}[]>([]);

onMounted(() => {
    signalAdd();
})

function refreshMaterialBrowserUI() {
    materialOptions.value = Object.values(window.editor.materials).map((item:any) => {
        return {
            label:item.name,
            value:item
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
    <div id="project-materials"  class="px-4">
        <n-select v-model:value="selectMaterial" filterable size="small"
            :placeholder="t('layout.sider.project[\'select material\']')" :options="materialOptions" />

            <!-- TODO 这里显示选中的材质图片 -->

        <div class="w-full text-center mt-2">
            <n-button type="primary" size="small" class="w-24" @click="assignMaterial">
                {{ t('layout.sider.project.assign') }}
            </n-button>
        </div>
    </div>
</template>
