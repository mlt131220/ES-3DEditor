<script lang="ts" setup>
import { inject, ref, onMounted,onUnmounted } from "vue";
import { useAddSignal, useRemoveSignal } from "@/hooks/useSignal";
import type { Material } from "three";
import { SetMaterialValueCommand } from '@/core/commands/SetMaterialValueCommand';
import {t} from "@/language";

const props = withDefaults(defineProps<{
    property: string,
    name: string
}>(), {
    property: "",
    name: ""
})

const show = ref(false);
const value = ref(false);
let object: { material: Material };
let material: Material;
let currentMaterialSlot = 0;

onMounted(() => {
    useAddSignal("objectSelected", handleObjectSelected);
    useAddSignal("materialChanged", update)
    useAddSignal("materialCurrentSlotChange", currentSlotChange);
})

onUnmounted(() => {
    useRemoveSignal("objectSelected", handleObjectSelected);
    useRemoveSignal("materialChanged", update);
    useRemoveSignal("materialCurrentSlotChange", currentSlotChange)
})

function currentSlotChange(currentSlot){
    currentMaterialSlot = currentSlot;
    update();
}

function handleObjectSelected(selected) {
    object = selected;
    update();
}

function update() {
    if (object === null || object.material === undefined) return;

    material = window.editor.getObjectMaterial( object, currentMaterialSlot );

    if (props.property in material) {
        value.value = material[props.property];
        show.value = true;
    } else {
        show.value = false;
    }
}

function onChange() {
    if (material[props.property] !== value.value) {
        window.editor.execute(new SetMaterialValueCommand(object, props.property, value.value, currentMaterialSlot));
    }
}

</script>

<template>
    <div class="sider-scene-material-boolean-property" v-if="show">
        <span>{{ t(`layout.sider.scene.${name}`) }}</span>
        <div>
            <n-checkbox size="small" v-model:checked="value" @update:checked="onChange" />
        </div>
    </div>
</template>

<style lang="less" scoped>
.sider-scene-material-boolean-property {
    display: flex;
    justify-content: space-around;
    margin: 0.4rem 0;
    align-items: center;

    &>span {
        width: 4rem;
        padding-left: 0.5rem;
    }

    &>div {
        width: 9rem;
        color: rgb(165, 164, 164);
    }
}
</style>