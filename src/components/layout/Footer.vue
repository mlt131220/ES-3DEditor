<script lang="ts" setup>
import { ref,inject } from 'vue';
import { NPopover, NButton, NIcon, NH3, NSelect, NForm, NFormItem,NInput,NSlider } from 'naive-ui';
import { Cogs } from '@vicons/fa'

const theme:string | undefined = inject("theme");
const set_theme:any = inject("set_theme");

const basicForm = ref({
    language: 'chinese',
    server:null,
    exportPricision:5,
});
</script>

<template>
    <div class="desc">ThreeJS Editor For Vue3.2 · Version 0.0.1 · Made by 二三</div>
    <n-popover trigger="click" placement="top-end">
        <template #trigger>
            <n-button circle>
                <template #icon>
                    <n-icon>
                        <Cogs />
                    </n-icon>
                </template>
            </n-button>
        </template>
        <template #header>
            <n-h3>基础设置</n-h3>
            <n-form
                :model="basicForm"
                ref="formRef"
                label-placement="left"
                :label-width="80"
                size="small"
                :style="{
                    minWidth: '240px'
                }"
            >
                <n-form-item label="主题">
                    <n-select
                        v-model:value="theme"
                        @update:value="set_theme"
                        :options="[{ label: '浅色', value: 'default' }, { label: '深色', value: 'darkTheme' }]"
                    />
                </n-form-item>
                <n-form-item label="语言">
                    <n-select
                        v-model:value="basicForm.language"
                        :options="[{ label: '中文', value: 'chinese' }, { label: 'English', value: 'english' }]"
                    />
                </n-form-item>
                <n-form-item label="服务器地址">
                    <n-input placeholder="请输入服务器地址" v-model:value="basicForm.server" />
                </n-form-item>
                <n-form-item label="输出精度">
                    <n-slider v-model:value="basicForm.exportPricision" />
                </n-form-item>
            </n-form>
        </template>
        <n-h3>操作设置</n-h3>
    </n-popover>
</template>

<style lang="scss" scoped>
.desc {
    display: inline-block;
}
.n-button {
    float: right;
    width: 34px;
    height: 34px;
    top: 15px;
}
</style>
