<script lang="ts" setup>
import { ref, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { NPopover, NButton, NIcon, NH3, NDivider, NSelect, NForm, NFormItem, NInput, NSlider, NTooltip, NSwitch } from 'naive-ui';
import { Cogs } from '@vicons/fa';
import GlobalConfig from '../../config/global';

const theme: string | undefined = inject("theme");
const SET_THEME: any = inject("set_theme");

/**
 * 修改语言
 * @param lang
 */
const { locale } = useI18n();
const SET_LOCALE = (lang: string):void => {
    window.localStorage.setItem('locale', lang);
    locale.value = lang;
}

const basicForm = ref({
    server: null,
    exportPricision: 5,
});
const OtherForm = ref({
    grid: true,
    helpers: true,
})

//本地存储
const persistent = ref(false);

const t: any = inject("t");
</script>

<template>
    <div class="desc">ThreeJS Editor For Vue3.2 · Version 0.0.1 · Made by 二三</div>
    <n-popover trigger="click" placement="top-end" class="layout-footer-n-popover">
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
            <n-h3>{{ t("layout.footer['Basic Setting']") }}</n-h3>
            <n-form
                :model="basicForm"
                label-placement="left"
                :label-width="100"
                size="small"
                :style="{
                    minWidth: '300px'
                }"
            >
                <n-form-item :label="t('layout.footer.Theme')">
                    <n-select
                        v-model:value="theme"
                        @update:value="SET_THEME"
                        :options="[{ label: t('layout.footer.Light'), value: 'default' }, { label: t('layout.footer.Dark'), value: 'darkTheme' }]"
                    />
                </n-form-item>
                <n-form-item :label="t('layout.footer.Language')">
                    <n-tooltip trigger="hover" placement="top-start">
                        <template #trigger>
                            <n-select
                                v-model:value="GlobalConfig.locale"
                                @update:value="SET_LOCALE"
                                :options="[{ label: '中文', value: 'zh-CN' }, { label: 'English', value: 'en-US' }]"
                            />
                        </template>
                        {{ t("layout.footer['Changing the language will refresh the page']") }}
                    </n-tooltip>
                </n-form-item>
                <n-form-item :label="t('layout.footer[\'Server Address\']')">
                    <n-input
                        :placeholder="t('layout.footer[\'Please enter the server address\']')"
                        v-model:value="basicForm.server"
                    />
                </n-form-item>
                <n-form-item :label="t('layout.footer[\'Export Pricision\']')">
                    <n-slider v-model:value="basicForm.exportPricision" />
                </n-form-item>
            </n-form>
        </template>
        <n-h3>{{ t("layout.footer['Other Setting']") }}</n-h3>
        <n-divider title-placement="left">{{ t("layout.footer.Viewport") }}</n-divider>
        <n-form
            :model="OtherForm"
            label-placement="left"
            :label-width="100"
            size="small"
            :style="{
                minWidth: '300px'
            }"
        >
            <n-form-item :label="t('layout.footer.Grid')">
                <n-switch size="small" v-model:value="OtherForm.grid" />
            </n-form-item>
            <n-form-item :label="t('layout.footer.Helpers')">
                <n-switch size="small" v-model:value="OtherForm.helpers" />
            </n-form-item>

            <n-divider title-placement="left">{{ t("layout.footer.Shortcuts") }}</n-divider>

            <n-form-item :label="t('layout.footer.Translate')">
                <n-input maxlength="1" :placeholder="t('layout.footer[\'Please press a key\']')" />
            </n-form-item>
            <n-form-item :label="t('layout.footer.Rotate')">
                <n-input maxlength="1" :placeholder="t('layout.footer[\'Please press a key\']')" />
            </n-form-item>
            <n-form-item :label="t('layout.footer.Scale')">
                <n-input maxlength="1" :placeholder="t('layout.footer[\'Please press a key\']')" />
            </n-form-item>
            <n-form-item :label="t('layout.footer.Undo')">
                <n-input maxlength="1" :placeholder="t('layout.footer[\'Please press a key\']')" />
            </n-form-item>
            <n-form-item :label="t('layout.footer.Focus')">
                <n-input maxlength="1" :placeholder="t('layout.footer[\'Please press a key\']')" />
            </n-form-item>
        </n-form>

        <n-divider />

        <div class="setting-history">
            <span>{{ t("layout.footer.History") }}</span>
            <n-switch v-model:value="persistent">
                <template #checked>{{ t("layout.footer.persistent") }}</template>
                <template #unchecked>{{ t("layout.footer.persistent") }}</template>
            </n-switch>
        </div>
        <n-input
            type="textarea"
            size="small"
            disabled
            :autosize="{
                minRows: 5,
                maxRows: 8
            }"
            placeholder=""
        />
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

.setting-history {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
}
</style>

<style lang="scss">
.layout-footer-n-popover{
    max-height: 40rem;
    overflow-y: auto;

    .n-divider{
        margin-top: 0;
        margin-bottom: 0.5rem;
    }
}
</style>
