<template>
    <div id="toolbar">
        <ViewportCamera />
        <n-button-group size="small">
            <n-button ghost :type="transfrom === 'translate' ? 'success' : 'default'" @click="handlerRadioChange('translate')">
                <template #icon>
                    <n-icon>
                        <MoveSharp />
                    </n-icon>
                </template>
            </n-button>
            <n-button ghost :type="transfrom === 'rotate' ? 'success' : 'default'" @click.stop="handlerRadioChange('rotate')">
                <template #icon>
                    <n-icon>
                        <SyncSharp />
                    </n-icon>
                </template>
            </n-button>
            <n-button ghost :type="transfrom === 'scale' ? 'success' : 'default'" @click="handlerRadioChange('scale')">
                <template #icon>
                    <n-icon>
                        <ResizeSharp />
                    </n-icon>
                </template>
            </n-button>
        </n-button-group>
        <n-checkbox v-model:checked="localValue" @update:checked="handlerCheckChange" size="small" class="ml-10px">
            {{ localValue ? t("layout.scene.toolbar.local") : t("layout.scene.toolbar.world") }}
        </n-checkbox>
    </div>
</template>

<script lang="ts" setup>
import { ref, inject } from "vue";
import { NCheckbox, NButtonGroup, NButton,NIcon } from "naive-ui";
import { MoveSharp,SyncSharp,ResizeSharp } from '@vicons/ionicons5';
import { useDispatchSignal } from '@/hooks/useSignal';
import ViewportCamera from '@/components/viewport/ViewportCamera.vue';
import {t} from "@/language";

const transfrom = ref("translate");
function handlerRadioChange(value: string) {
    transfrom.value = value;
    useDispatchSignal("transformModeChanged", value);
}

const localValue = ref(false);
function handlerCheckChange(checked: boolean) {
    useDispatchSignal("spaceChanged", checked ? 'local' : 'world');
}

</script>

<style lang="less" scope>
#toolbar {
    height: 1.4rem;
    display: flex;
    width: 100%;
    border-bottom: 1px solid #dbdbdb;
    overflow-y: hidden;
    align-items: center;
}
</style>