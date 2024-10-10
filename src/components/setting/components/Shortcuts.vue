<template>
  <n-form :model="form" label-placement="left" :label-width="120" class="mt-2"
          :style="{ minWidth: '300px' }">
    <n-form-item :label="t('setting.shortcuts.Translate')">
      <n-input v-model:value="form.translate" readonly maxlength="1"
               :placeholder="t('setting.shortcuts.Please press a key')"
               @keyup="shortcutsKeyup($event, 'translate')"/>
    </n-form-item>
    <n-form-item :label="t('setting.shortcuts.Rotate')">
      <n-input v-model:value="form.rotate" readonly maxlength="1"
               :placeholder="t('setting.shortcuts.Please press a key')"
               @keyup="shortcutsKeyup($event, 'rotate')"/>
    </n-form-item>
    <n-form-item :label="t('setting.shortcuts.Scale')">
      <n-input v-model:value="form.scale" readonly maxlength="1"
               :placeholder="t('setting.shortcuts.Please press a key')"
               @keyup="shortcutsKeyup($event, 'scale')"/>
    </n-form-item>
    <n-form-item :label="t('setting.shortcuts.Undo')">
      <n-input v-model:value="form.undo" readonly maxlength="1"
               :placeholder="t('setting.shortcuts.Please press a key')" @keyup="shortcutsKeyup($event, 'undo')"/>
      <EsTip class="ml-1">
        {{
          `${!IS_MAC ? 'ctrl' : 'meta'} + ${form.undo} ${t('other.undo')},${!IS_MAC ? 'ctrl' : 'meta'} + shift + ${form.undo} ${t('other.redo')}`
        }}
      </EsTip>
    </n-form-item>
    <n-form-item :label="t('setting.shortcuts.Focus')">
      <n-input v-model:value="form.focus" readonly maxlength="1"
               :placeholder="t('setting.shortcuts.Please press a key')"
               @keyup="shortcutsKeyup($event, 'focus')"/>
    </n-form-item>
  </n-form>
</template>

<script setup lang="ts">
import {reactive,onMounted} from "vue";
import {t} from "@/language";
import EsTip from "@/components/es/EsTip.vue";
import {RemoveObjectCommand} from "@/core/commands/RemoveObjectCommand";
import {useDispatchSignal} from "@/hooks/useSignal";

// 由于撤消/重做，目前不能使用z
const isValidKeyBinding = (key) => key.match(/^[A-Za-z0-9]$/i);
const form = reactive({
  // shortcuts
  translate: window.editor.config.getKey('settings/shortcuts/translate'),
  rotate: window.editor.config.getKey('settings/shortcuts/rotate'),
  scale: window.editor.config.getKey('settings/shortcuts/scale'),
  undo: window.editor.config.getKey('settings/shortcuts/undo'),
  focus: window.editor.config.getKey('settings/shortcuts/focus'),
})

// 快捷键输入框keyup
function shortcutsKeyup(event, varName) {
  //判断按下的是否是有效的键
  if (!isValidKeyBinding(event.key)) return;
  form[varName] = event.key;
  window.editor.config.setKey(`settings/shortcuts/${varName}`, event.key.toLowerCase());
}

const IS_MAC = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
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

<style scoped lang="less">
.n-input{
  width: 6rem !important;
  text-align: center;
}
</style>