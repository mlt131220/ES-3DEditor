<script lang="ts" setup>
import { ref, inject } from 'vue';
import { NPopover, NButton, NIcon, NH3, NSelect, NForm, NFormItem, NInput, NSlider, NTooltip } from 'naive-ui';
import { Cogs } from '@vicons/fa';
import { SET_LOCALE } from '../../language';
import GlobalConfig from '../../config/global';

const theme: string | undefined = inject("theme");
const SET_THEME: any = inject("set_theme");

const basicForm = ref({
    language: GlobalConfig.locale,
    server: null,
    exportPricision: 5,
});
const t:any = inject("t");
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
                        @update:value="SET_THEME"
                        :options="[{ label: '浅色', value: 'default' }, { label: '深色', value: 'darkTheme' }]"
                    />
                </n-form-item>
                <n-form-item label="语言">
                    <n-tooltip trigger="hover" placement="top-start">
                        <template #trigger>
                            <n-select
                                v-model:value="basicForm.language"
                                @update:value="SET_LOCALE"
                                :options="[{ label: '中文', value: 'zh-CN' }, { label: 'English', value: 'en-US' }]"
                            />
                        </template>
                        更改语言将会刷新页面
                    </n-tooltip>
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
    width: 1.7rem;
    height: 1.7rem;
}
</style>
