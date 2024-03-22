<script lang="ts" setup>
import { ref, reactive, inject, onMounted } from 'vue';
import {setLocale,t} from "@/language";
import { Cogs } from '@vicons/fa';
import {locale as GlobalConfigLocale} from '@/config/global';
import { useAddSignal, useDispatchSignal } from "@/hooks/useSignal";
import { RemoveObjectCommand } from '@/core/commands/RemoveObjectCommand';
import { useThemeVars } from 'naive-ui';
import Tip from '@/components/header/Tip.vue';

const themeVars = useThemeVars();

const theme: string  = inject("theme") as string;
const SET_THEME: (value:string) => void = inject("set_theme") as (value:string) => void;

/**
 * 修改语言
 * @param lang
 */
const currentLocale = ref(GlobalConfigLocale);

const OtherForm = reactive({
    grid: true,
    helpers: true,
    // shortcuts
    translate: window.editor.config.getKey('settings/shortcuts/translate'),
    rotate: window.editor.config.getKey('settings/shortcuts/rotate'),
    scale: window.editor.config.getKey('settings/shortcuts/scale'),
    undo: window.editor.config.getKey('settings/shortcuts/undo'),
    focus: window.editor.config.getKey('settings/shortcuts/focus'),
})

const IS_MAC = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
// 由于撤消/重做，目前不能使用z
const isValidKeyBinding = (key) => key.match(/^[A-Za-z0-9]$/i);

// 快捷键输入框keyup
function shortcutsKeyup(event, varName) {
    //判断按下的是否是有效的键
    if (!isValidKeyBinding(event.key)) return;
    OtherForm[varName] = event.key;
    window.editor.config.setKey(`settings/shortcuts/${varName}`, event.key.toLowerCase());
}

//历史记录 -> 本地存储
const persistent:boolean = ref(window.editor.config.getKey('settings/history'));
const historyList = ref<Array<{ name: string, id: string, opacity?: number }>>([]);
const selectedHistory = ref<{ name: string, id: string, opacity?: number }>({ name: "", id: '' });
// 历史记录 -> 本地存储 change
function persistentChange(value) {
    window.editor.config.setKey('settings/history', value);
    if (value) {
        const tip = t("prompt['The history will be preserved across sessions. This can have an impact on performance when working with textures.']");
        window.$message?.warning(tip);

        const lastUndoCmd = window.editor.history.undos[window.editor.history.undos.length - 1];
        const lastUndoId = (lastUndoCmd !== undefined) ? lastUndoCmd.id : 0;
        window.editor.history.enableSerialization(lastUndoId);
    } else {
        useDispatchSignal("historyChanged");
    }
}
let ignoreObjectSelectedSignal = false;
function historyItemClick(item) {
    selectedHistory.value = item;
    ignoreObjectSelectedSignal = true;
    window.editor.history.goToState(parseInt(selectedHistory.value.id));
    ignoreObjectSelectedSignal = false;
}

onMounted(() => {
    document.addEventListener("keydown", function (event) {
        switch (event.key.toLowerCase()) {
            case 'delete':
                const object = window.editor.selected;
                if (object === null) return;

                const parent = object.parent;
                if (parent !== null) window.editor.execute(new RemoveObjectCommand(object));
                break;
            case window.editor.config.getKey('settings/shortcuts/translate'):
                useDispatchSignal('transformModeChanged', 'translate');
                break;
            case window.editor.config.getKey('settings/shortcuts/rotate'):
                useDispatchSignal('transformModeChanged', 'rotate');
                break;
            case window.editor.config.getKey('settings/shortcuts/scale'):
                useDispatchSignal('transformModeChanged', 'scale');
                break;
            case window.editor.config.getKey('settings/shortcuts/undo'):
                // windows下：ctrl + window.editor.config.getKey('settings/shortcuts/undo') 撤销，同时按下shift重做
                // mac下：meta + window.editor.config.getKey('settings/shortcuts/undo') 撤销，同时按下shift重做
                if (IS_MAC ? event.metaKey : event.ctrlKey) {
                    //阻止特定于浏览器的热键
                    event.preventDefault();
                    if (event.shiftKey) {
                        window.editor.redo();
                    } else {
                        window.editor.undo();
                    }
                }
                break;
            case window.editor.config.getKey('settings/shortcuts/focus'):
                if (window.editor.selected !== null) {
                    window.editor.focus(window.editor.selected);
                }
                break;
        }
    })

    refreshUI();
    signalsAdd();
})

const refreshUI = () => {
    const options: any = [];

    ((objects) => {
        for (let i = 0, l = objects.length; i < l; i++) {
            const object = objects[i];
            options.push({
                name: object.name,
                id: object.id
            });
        }
    })(window.editor.history.undos);

    ((objects) => {
        for (let i = objects.length - 1; i >= 0; i--) {
            const object = objects[i];
            options.push({
                name: object.name,
                id: object.id,
                opacity: 0.3
            });
        }
    })(window.editor.history.redos);

    historyList.value = options;
}

function signalsAdd() {
    useAddSignal("editorCleared", refreshUI);
    useAddSignal("historyChanged", refreshUI);
    useAddSignal("historyChanged", (cmd) => {
        if (ignoreObjectSelectedSignal) return;
        selectedHistory.value = cmd !== undefined ? cmd : { name: "", id: '' };
    });
}
</script>

<template>
     <div class="desc !flex items-center">
       <a href="https://www.upyun.com/?utm_source=lianmeng&utm_medium=referral"
          target="blank" class="h-full flex items-center">本网站由&nbsp;&nbsp;<img class="w-12 mb-3px" src="https://upyun.mhbdng.cn/assets/logo/upyun-logo.png" alt="又拍云">&nbsp;&nbsp;提供CDN加速/云存储服务</a>
       &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;
       ES 3DEditor · Version 0.8.0 · Made by 二三 &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;<p><a href="https://beian.miit.gov.cn/" target="_blank" >X ICP备xxxxxx号</a></p>
     </div>
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
            <n-form label-placement="left" :label-width="100" size="small"
                :style="{ minWidth: '300px' }">
                <!-- 主题 -->
                <n-form-item :label="t('layout.footer.Theme')">
                    <n-radio-group v-model:value="theme" name="theme" @update:value="SET_THEME">
                        <n-space>
                            <n-radio
                                v-for="lang in [{ label: t('layout.footer.Light'), value: 'default' }, { label: t('layout.footer.Dark'), value: 'darkTheme' }]"
                                :key="lang.value" :value="lang.value">
                                {{ lang.label }}
                            </n-radio>
                        </n-space>
                    </n-radio-group>
                </n-form-item>
                <!-- 语言 -->
                <n-form-item :label="t('layout.footer.Language')">
                    <n-radio-group v-model:value="currentLocale" name="language" @update:value="setLocale">
                        <n-space>
                            <n-radio
                                v-for="lang in [{ label: '中文', value: 'zh-CN' }, { label: 'English', value: 'en-US' }]"
                                :key="lang.value" :value="lang.value">
                                {{ lang.label }}
                            </n-radio>
                        </n-space>
                    </n-radio-group>
                </n-form-item>
            </n-form>
        </template>
        <n-h3>{{ t("layout.footer['Other Setting']") }}</n-h3>
        <n-divider title-placement="left">{{ t("layout.footer.Viewport") }}</n-divider>
        <n-form :model="OtherForm" label-placement="left" :label-width="100" size="small"
            :style="{ minWidth: '300px' }">
            <!-- 网格 -->
            <n-form-item :label="t('layout.footer.Grid')">
                <n-switch size="small" v-model:value="OtherForm.grid"
                    @update:value="useDispatchSignal('showGridChanged', OtherForm.grid)" />
            </n-form-item>
            <!-- 辅助 -->
            <n-form-item :label="t('layout.footer.Helpers')">
                <n-switch size="small" v-model:value="OtherForm.helpers"
                    @update:value="useDispatchSignal('showHelpersChanged', OtherForm.helpers)" />
            </n-form-item>

            <n-divider title-placement="left">{{ t("layout.footer.Shortcuts") }}</n-divider>

            <n-form-item :label="t('layout.footer.Translate')">
                <n-input v-model:value="OtherForm.translate" readonly maxlength="1" class="!w-12 text-center"
                    :placeholder="t('layout.footer[\'Please press a key\']')"
                    @keyup="shortcutsKeyup($event, 'translate')" />
            </n-form-item>
            <n-form-item :label="t('layout.footer.Rotate')">
                <n-input v-model:value="OtherForm.rotate" readonly maxlength="1" class="!w-12 text-center"
                    :placeholder="t('layout.footer[\'Please press a key\']')"
                    @keyup="shortcutsKeyup($event, 'rotate')" />
            </n-form-item>
            <n-form-item :label="t('layout.footer.Scale')">
                <n-input v-model:value="OtherForm.scale" readonly maxlength="1" class="!w-12 text-center"
                    :placeholder="t('layout.footer[\'Please press a key\']')"
                    @keyup="shortcutsKeyup($event, 'scale')" />
            </n-form-item>
            <n-form-item :label="t('layout.footer.Undo')">
                <n-input v-model:value="OtherForm.undo" readonly maxlength="1" class="!w-12 text-center"
                    :placeholder="t('layout.footer[\'Please press a key\']')" @keyup="shortcutsKeyup($event, 'undo')" />
                <Tip class="ml-1">{{ `${!IS_MAC ? 'ctrl' : 'meta'} + ${OtherForm.undo} ${t('other.undo')},${!IS_MAC ? 'ctrl' : 'meta'} + shift + ${OtherForm.undo} ${t('other.redo')}` }}</Tip>
            </n-form-item>
            <n-form-item :label="t('layout.footer.Focus')">
                <n-input v-model:value="OtherForm.focus" readonly maxlength="1" class="!w-12 text-center"
                    :placeholder="t('layout.footer[\'Please press a key\']')"
                    @keyup="shortcutsKeyup($event, 'focus')" />
            </n-form-item>
        </n-form>

        <n-divider />

        <div class="setting-history">
            <span>{{ t("layout.footer.History") }}</span>
            <div class="flex items-center">
                <n-switch v-model:value="persistent" @update:value="persistentChange">
                    <template #checked>{{ t("layout.footer.persistent") }}</template>
                    <template #unchecked>{{ t("layout.footer.persistent") }}</template>
                </n-switch>
            </div>
        </div>
        <n-card
            :content-style="`padding: 0;height:10rem;overflow-y:auto;flex:unset;background-color:${themeVars.inputColorDisabled};`">
            <n-list hoverable clickable>
                <n-list-item v-for="(item, index) in historyList" :key="index" @click="historyItemClick(item)"
                    :style="`background-color:${selectedHistory.id !== item.id ? themeVars.inputColorDisabled : themeVars.hoverColor};padding: 0.2rem 0.6rem;`">
                    {{ item.name }}
                </n-list-item>
            </n-list>
        </n-card>
    </n-popover>
</template>

<style lang="less" scoped>
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
    align-items: center;
}
</style>

<style lang="less">
.layout-footer-n-popover {
    max-height: 40rem;
    overflow-y: auto;
    overflow-x: hidden;

    .n-divider {
        margin-top: 0;
        margin-bottom: 0.5rem;
    }
}
</style>
