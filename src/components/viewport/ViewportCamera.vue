<template>
    <n-select v-model:value="value" :options="options" size="small"
        class="w-10rem" @update:value="handlerChange" />
</template>

<script lang="ts" setup>
import { ref,onMounted } from "vue"
import { NSelect } from 'naive-ui';
import {useAddSignal} from '@/hooks/useSignal';

interface Option {
    [s:string]:string
}

const value = ref();
const options = ref<Option[]>([]);

function handlerChange(){
    window.editor.setViewportCamera(value.value);
}

function handlerOptionsUpdate() {
    const option:Option[] = [];
    const cameras = window.editor.cameras;
    for (const key in cameras) {
        const camera = cameras[key];
        option.push({
            label:camera.name,
            value:camera.uuid
        })
    }
    options.value = option;
    value.value = window.editor.viewportCamera.uuid;
}

onMounted(()=>{
    useAddSignal("cameraAdded",handlerOptionsUpdate);
    useAddSignal("cameraRemoved",handlerOptionsUpdate);

    handlerOptionsUpdate();
})


</script>