<script lang="ts" setup>
import {reactive, onMounted} from 'vue';
import {setLocale, t} from "@/language";
import {Cogs} from '@vicons/fa';
import {useGlobalConfigStore} from "@/store/modules/globalConfig";
import {useDispatchSignal} from "@/hooks/useSignal";
import {RemoveObjectCommand} from '@/core/commands/RemoveObjectCommand';
import Tip from '@/components/header/Tip.vue';

const {theme, setTheme, locale} = useGlobalConfigStore();

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
})
</script>

<template>
  <div class="desc !flex items-center">
    <a href="https://www.upyun.com/?utm_source=lianmeng&utm_medium=referral"
       target="blank" class="h-full flex items-center">本网站由&nbsp;&nbsp;<img class="w-12 mb-3px"
                                                                                src="https://upyun.mhbdng.cn/assets/logo/upyun-logo.png"
                                                                                alt="又拍云">&nbsp;&nbsp;提供CDN加速/云存储服务</a>
    &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;
    ES 3DEditor · Version 0.8.0 · Made by 二三 &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;<p><a href="https://beian.miit.gov.cn/" target="_blank">X ICP备xxxxxxx号-1</a></p>
  </div>
  <n-popover trigger="click" placement="top-end" class="layout-footer-n-popover">
    <template #trigger>
      <n-button circle>
        <template #icon>
          <n-icon>
            <Cogs/>
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
          <n-select v-model:value="theme" @update:value="setTheme" size="small"
                    :options="[
                        { label: t('layout.footer[\'Use system theme\']'), value: 'osTheme' },
                        { label: t('layout.footer.Light'), value: 'lightTheme' },
                        { label: t('layout.footer.Dark'), value: 'darkTheme' },
                    ]"/>
        </n-form-item>
        <!-- 语言 -->
        <n-form-item :label="t('layout.footer.Language')">
          <n-select v-model:value="locale" @update:value="setLocale" size="small"
                    :options="[{ label: '中文', value: 'zh-CN' }, { label: 'English', value: 'en-US' }]"/>
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
                  @update:value="useDispatchSignal('showGridChanged', OtherForm.grid)"/>
      </n-form-item>
      <!-- 辅助 -->
      <n-form-item :label="t('layout.footer.Helpers')">
        <n-switch size="small" v-model:value="OtherForm.helpers"
                  @update:value="useDispatchSignal('showHelpersChanged', OtherForm.helpers)"/>
      </n-form-item>

      <n-divider title-placement="left">{{ t("layout.footer.Shortcuts") }}</n-divider>

      <n-form-item :label="t('layout.footer.Translate')">
        <n-input v-model:value="OtherForm.translate" readonly maxlength="1" class="!w-12 text-center"
                 :placeholder="t('layout.footer[\'Please press a key\']')"
                 @keyup="shortcutsKeyup($event, 'translate')"/>
      </n-form-item>
      <n-form-item :label="t('layout.footer.Rotate')">
        <n-input v-model:value="OtherForm.rotate" readonly maxlength="1" class="!w-12 text-center"
                 :placeholder="t('layout.footer[\'Please press a key\']')"
                 @keyup="shortcutsKeyup($event, 'rotate')"/>
      </n-form-item>
      <n-form-item :label="t('layout.footer.Scale')">
        <n-input v-model:value="OtherForm.scale" readonly maxlength="1" class="!w-12 text-center"
                 :placeholder="t('layout.footer[\'Please press a key\']')"
                 @keyup="shortcutsKeyup($event, 'scale')"/>
      </n-form-item>
      <n-form-item :label="t('layout.footer.Undo')">
        <n-input v-model:value="OtherForm.undo" readonly maxlength="1" class="!w-12 text-center"
                 :placeholder="t('layout.footer[\'Please press a key\']')" @keyup="shortcutsKeyup($event, 'undo')"/>
        <Tip class="ml-1">{{
            `${!IS_MAC ? 'ctrl' : 'meta'} + ${OtherForm.undo} ${t('other.undo')},${!IS_MAC ? 'ctrl' : 'meta'} + shift + ${OtherForm.undo} ${t('other.redo')}`
          }}
        </Tip>
      </n-form-item>
      <n-form-item :label="t('layout.footer.Focus')">
        <n-input v-model:value="OtherForm.focus" readonly maxlength="1" class="!w-12 text-center"
                 :placeholder="t('layout.footer[\'Please press a key\']')"
                 @keyup="shortcutsKeyup($event, 'focus')"/>
      </n-form-item>
    </n-form>
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
