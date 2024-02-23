<script lang="ts" setup>
import { inject, ref, onMounted,onUnmounted } from "vue";
import { useAddSignal, useDispatchSignal,useRemoveSignal } from "@/hooks/useSignal";
import type { Material } from "three";
import {t} from "@/language";

const props = withDefaults(defineProps<{
    property: string
}>(), {
    property: ""
})

const show = ref(false);
let object: { material: Material } | null = null;
let material: Material;
let materialSlot = 0;

onMounted(() => {
    useAddSignal("materialChanged", update);
    useAddSignal("objectSelected", handleObjectSelected);
    useAddSignal("materialCurrentSlotChange", currentMaterialSlotChange);
})

onUnmounted(()=>{
    useRemoveSignal("objectSelected", handleObjectSelected);
    useRemoveSignal("materialChanged", update);
    useRemoveSignal("materialCurrentSlotChange", currentMaterialSlotChange);
})

function currentMaterialSlotChange(currentMaterialSlot) {
    materialSlot = currentMaterialSlot;
    update();
}

function handleObjectSelected(selected) {
    object = selected;
    update();
}

function programClick(key) {
    useDispatchSignal("editScript", object, key);
}

function update() {
    if (object === null || object.material === undefined) return;

    material = window.editor.getObjectMaterial(object, materialSlot);

    if (props.property in material) {
        show.value = true;
    } else {
        show.value = false;
    }
}
</script>

<template>
    <div id="sider-scene-material-program" v-if="show">
        <n-divider title-placement="left">{{ t("layout.sider.scene.Programme") }}</n-divider>

        <div class="sider-scene-material-program-item">
            <!-- programInfo -->
            <n-button size="small" @click="programClick('programInfo')">{{ t("layout.sider.scene.Info") }}</n-button>

            <!-- programVertex -->
            <n-button size="small" @click="programClick('vertexShader')">{{ t("layout.sider.scene.Vert") }}</n-button>

            <!-- programFragment -->
            <n-button size="small" @click="programClick('fragmentShader')">{{ t("layout.sider.scene.Frag") }}</n-button>
        </div>

        <n-divider />
    </div>
</template>

<style lang="less" scoped>
#sider-scene-material-program {
    .sider-scene-material-program-item {
        display: flex;
        justify-content: space-around;
        margin: 0 1rem;
    }

    :deep(.n-divider) {
        margin-top: 0.7rem;
        margin-bottom: 0.5rem;

        .n-divider__title {
            font-weight: 500;
            font-size: 0.7rem;
        }
    }
}
</style>