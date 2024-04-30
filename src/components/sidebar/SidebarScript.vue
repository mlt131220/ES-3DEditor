<template>
  <EsDocument url="http://editor-doc.mhbdng.cn/core/script.html" />

  <div v-if="isSelectObject3D">
    <n-list hoverable clickable>
      <n-list-item v-for="(script,index) in scripts" :key="index">
        <EsInput size="small" defaultNoBorder v-model:value="script.name" @change="(n) => handleNameChange(script,n)"/>
        <n-button size="small" class="ml-5px" @click="handleEdit(script)">
          {{ t('layout.sider.script.Edit') }}
        </n-button>
        <n-button size="small" class="ml-5px" @click="handleRemove(script)">
          {{ t('layout.sider.script.Remove') }}
        </n-button>
      </n-list-item>
    </n-list>

    <div class="w-full text-center mt-2">
      <n-button size="small" type="primary" @click="handleNew">{{ t('layout.sider.script.New') }}</n-button>
    </div>
  </div>

  <n-result v-else status="418" title="Empty" :description="t('prompt[\'No object selected.\']')"/>

  <Script />
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref, toRaw, h} from "vue";
import {NInput} from "naive-ui";
import {Link} from "@vicons/carbon";
import {t} from "@/language";
import {useAddSignal, useDispatchSignal, useRemoveSignal} from "@/hooks/useSignal";
import {SetScriptValueCommand, RemoveScriptCommand, AddScriptCommand} from "@/core/commands/Commands";
import EsInput from "@/components/es/EsInput.vue";
import Script from "@/components/code/Script.vue";
import {Source} from "@/core/script/Source.js";
import EsDocument from "@/components/es/EsDocument.vue";

const isSelectObject3D = ref(false);
const scripts = ref<IScript.IStruct[]>([]);

onMounted(() => {
  useAddSignal("objectSelected", objectSelected);

  useAddSignal("scriptAdded", updateUI);
  useAddSignal("scriptRemoved", updateUI);
  useAddSignal("scriptChanged", updateUI);
})
onBeforeUnmount(() => {
  useRemoveSignal("objectSelected", objectSelected);

  useRemoveSignal("scriptAdded", updateUI);
  useRemoveSignal("scriptRemoved", updateUI);
  useRemoveSignal("scriptChanged", updateUI);
})

function objectSelected(object) {
  if (object !== null && window.editor.camera !== object) {
    isSelectObject3D.value = true;
    updateUI();
  } else {
    isSelectObject3D.value = false;
  }
}

function updateUI() {
  const object = window.editor.selected;

  if (object === null) return;

  // 直接使用scripts.value = window.editor.scripts[object.uuid]会导致数据更新不及时，所以这里重新获取数据
  scripts.value = [];
  window.editor.scripts[object.uuid]?.forEach((sc:IScript.IStruct) => {
    scripts.value.push(sc);
  });
}

function handleNew() {
  const v = ref("");
  const status = ref("");

  window.$dialog.warning({
    title: t("layout.sider.script['Please enter the script name']"),
    content: () => h(NInput, {
      modelValue: v.value,
      placeholder: "",
      clearable: true,
      size: "small",
      status: status.value,
      onUpdateValue: (n: string) => {
        v.value = n;
        status.value = !v.value ? "error" : "";
      },
      onBlur: () => {
        status.value = !v.value ? "error" : "";
      }
    }),
    positiveText: t('other.ok'),
    negativeText: t('other.cancel'),
    onPositiveClick: () => {
      if (!v.value) return false;

      // 检查名称是否重复
      if (window.editor.scripts[window.editor.selected.uuid]?.find((s) => s.name === v.value)) {
        window.$message?.error(t("layout.sider.script['The script name already exists']"));

        return false;
      }

      const script = {name: v.value, source: Source};
      window.editor.execute(new AddScriptCommand(window.editor.selected, script));
    },
  })
}

function handleNameChange(script:IScript.IStruct, name: string) {
  window.editor.execute(new SetScriptValueCommand(window.editor.selected, script, 'name', name));
}

function handleEdit(script:IScript.IStruct) {
  useDispatchSignal("editScript", window.editor.selected, toRaw(script));
}

function handleRemove(script:IScript.IStruct) {
  window.$dialog.warning({
    title: t("other.warning"),
    content: t("core['Any unsaved data will be lost. Are you sure?']"),
    positiveText: t('other.ok'),
    negativeText: t('other.cancel'),
    onPositiveClick: () => {
      window.editor.execute(new RemoveScriptCommand(window.editor.selected, toRaw(script)));
    },
  });
}
</script>

<style scoped lang="less">
.n-list {
  &-item {
    padding: 0 !important;

    :deep(&__main) {
      display: flex;
      align-items: center;
      padding: 5px 0;
    }
  }
}
</style>