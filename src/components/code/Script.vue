<template>
  <n-modal v-model:show="show" class="!w-90vw" preset="dialog" :title="title" :showIcon="false">
    <div ref="MonacoEditorScriptRef" class="h-80vh"></div>

    <div class="float-right mt-10px">
      <n-button size="small" @click="show = false">{{t('other.cancel')}}</n-button>
      <n-button class="ml-5px" type="primary" size="small" @click="submit">{{t('other.ok')}}</n-button>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import {nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {Object3D} from "three";
import {t} from "@/language";
import {useMonacoEditor} from '@/hooks/useMonacoEditor';
import {useAddSignal,useRemoveSignal,useDispatchSignal} from '@/hooks/useSignal';
import {SetScriptValueCommand} from "@/core/commands/SetScriptValueCommand";
import {SetMaterialValueCommand} from "@/core/commands/SetMaterialValueCommand";

const {monacoRef, getModel,initMonaco} = useMonacoEditor();

const MonacoEditorScriptRef = ref();
const title = ref("");
const show = ref(false);
const script = ref({
  name: '',
  source: ''
});
const mode = ref('javascript');
let currentScript: IScript.IStruct | string | null = null;
let currentObject: Object3D | null = null;

onMounted(async () => {
  await initMonaco();

  useAddSignal("editorCleared",editorCleared);
  useAddSignal("scriptRemoved",scriptRemoved);
  useAddSignal("editScript",editScript);
})
onBeforeUnmount(() => {
  useRemoveSignal("editorCleared",editorCleared);
  useRemoveSignal("scriptRemoved",scriptRemoved);
  useRemoveSignal("editScript",editScript);
})

function initEditor() {
  // 保证单实例
  if(monacoRef.value.editor.getModels().length > 0) {
    getModel()?.dispose();
  }

  monacoRef.value.editor.create(MonacoEditorScriptRef.value, {
    value: script.value.source,
    language: mode.value,
    acceptSuggestionOnCommitCharacter: true, // 接受关于提交字符的建议
    acceptSuggestionOnEnter: 'on', // 接受输入建议 "on" | "off" | "smart"
    accessibilityPageSize: 10, // 辅助功能页面大小 Number 说明：控制编辑器中可由屏幕阅读器读出的行数。警告：这对大于默认值的数字具有性能含义。
    accessibilitySupport: 'on', // 辅助功能支持 控制编辑器是否应在为屏幕阅读器优化的模式下运行。
    autoClosingBrackets: 'always', // 是否自动添加结束括号(包括中括号) "always" | "languageDefined" | "beforeWhitespace" | "never"
    autoClosingDelete: 'always', // 是否自动删除结束括号(包括中括号) "always" | "never" | "auto"
    autoClosingOvertype: 'always', // 是否关闭改写 即使用insert模式时是覆盖后面的文字还是不覆盖后面的文字 "always" | "never" | "auto"
    autoClosingQuotes: 'always', // 是否自动添加结束的单引号 双引号 "always" | "languageDefined" | "beforeWhitespace" | "never"
    automaticLayout: true, // 自动布局
    codeLens: true, // 是否显示codeLens 通过 CodeLens，你可以在专注于工作的同时了解代码所发生的情况 – 而无需离开编辑器。 可以查找代码引用、代码更改、关联的 Bug、工作项、代码评审和单元测试。
    codeLensFontFamily: '', // codeLens的字体样式
    codeLensFontSize: 13, // codeLens的字体大小
    colorDecorators: true, // 呈现内联色彩装饰器和颜色选择器
    comments: {
      ignoreEmptyLines: true, // 插入行注释时忽略空行。默认为真。
      insertSpace: true, // 在行注释标记之后和块注释标记内插入一个空格。默认为真。
    }, // 注释配置
    contextmenu: true, // 启用上下文菜单
    columnSelection: true, // 启用列编辑 按下shift键位然后按↑↓键位可以实现列选择 然后实现列编辑
    autoSurround: 'never', // 是否应自动环绕选择
    copyWithSyntaxHighlighting: true, // 是否应将语法突出显示复制到剪贴板中 即 当你复制到word中是否保持文字高亮颜色
    cursorBlinking: 'smooth', // 光标动画样式
    cursorSmoothCaretAnimation: 'on', // 是否启用光标平滑插入动画  当你在快速输入文字的时候 光标是直接平滑的移动还是直接"闪现"到当前文字所处位置
    cursorStyle: 'line', // "Block"|"BlockOutline"|"Line"|"LineThin"|"Underline"|"UnderlineThin" 光标样式
    cursorSurroundingLines: 0, // 光标环绕行数 当文字输入超过屏幕时 可以看见右侧滚动条中光标所处位置是在滚动条中间还是顶部还是底部 即光标环绕行数 环绕行数越大 光标在滚动条中位置越居中
    cursorSurroundingLinesStyle: 'all', // "default" | "all" 光标环绕样式
    cursorWidth: 2, // <=25 光标宽度
    minimap: {
      enabled: true, // 是否启用预览图
    }, // 预览图设置
    scrollbar: {
      verticalScrollbarSize: 5,
      horizontalScrollbarSize: 5,
      arrowSize: 10,
      alwaysConsumeMouseWheel: false,
    },
    folding: true, // 是否启用代码折叠
    links: true, // 是否点击链接
    overviewRulerBorder: true, // 是否应围绕概览标尺绘制边框
    renderLineHighlight: 'gutter', // 当前行突出显示方式
    scrollBeyondLastLine: false, // 设置编辑器是否可以滚动到最后一行之后
    readOnly: false, // 是否为只读模式
    lineNumbers: 'on',
    lineNumbersMinChars: 0,
    theme: 'vs-dark', //官方自带三种主题vs, hc-black, or vs-dark
    fontSize: 13,
    roundedSelection: false, // 右侧不显示编辑器预览框
    autoIndent: 'full',
    formatOnType: true,
    formatOnPaste: true
  });
}

// 销毁
watch(() => show.value,(nv) => {
  if(!nv){
    setTimeout(() => {
      getModel()?.dispose();
    },200)
  }
})

function editorCleared() {
  show.value = false;
  script.value = {
    name: '',
    source: ''
  }
}

function scriptRemoved(sc:IScript.IStruct){
  if (script.value.name === sc.name) {
    editorCleared();
  }
}

function editScript(object:Object3D, sc:IScript.IStruct | string) {
  if (typeof (sc) === 'object') {
    mode.value = 'javascript';
    script.value.name = sc.name;
    script.value.source = sc.source;
    title.value = object.name + ' / ' + script.value.name;
  } else {
    switch (sc) {
      case 'vertexShader':
        mode.value = 'glsl';
        script.value.name = 'Vertex Shader';
        // @ts-ignore
        script.value.source = object.material.vertexShader || '';
        break;

      case 'fragmentShader':
        mode.value = 'glsl';
        script.value.name = 'Fragment Shader';
        // @ts-ignore
        script.value.source = object.material.fragmentShader || '';
        break;

      case 'programInfo':
        mode.value = 'json';
        script.value.name = 'Program Properties';
        const json = {
          // @ts-ignore
          defines: object.material.defines,
          // @ts-ignore
          uniforms: object.material.uniforms,
          // @ts-ignore
          attributes: object.material.attributes
        };
        script.value.source = JSON.stringify( json, null, '\t' );
    }

    // @ts-ignore
    title.value = object.material.name + ' / ' + script.value.name;
  }

  currentScript = sc;
  currentObject = object;

  show.value = true;

  nextTick().then(() => {
    initEditor();
  });
}

function submit(e: Event) {
  e.stopPropagation();

  console.log(monacoRef.value.editor.getModelMarkers())

  if(monacoRef.value.editor.getModelMarkers().length > 0){
    window.$message?.error(t("prompt['There are grammatical errors!']"));
  }else{
    if(!currentObject) return;

    const value = getModel().getValue();

    if (typeof (currentScript) === 'object') {
      if (value !== currentScript?.source) {
        window.editor.execute(new SetScriptValueCommand(currentObject as Object3D, currentScript as IScript.IStruct, 'source', value));
      }

      show.value = false;
      return;
    }

    if(mode.value === 'glsl'){
      currentObject.material[currentScript] = value;
      currentObject.material.needsUpdate = true;
      useDispatchSignal('materialChanged', currentObject, 0);

      show.value = false;
      return;
    }

    if (currentScript !== 'programInfo') {
      show.value = false;
      return;
    }

    const json = JSON.parse(value);

    if (JSON.stringify(currentObject.material.defines) !== JSON.stringify(json.defines)) {
      const cmd = new SetMaterialValueCommand(currentObject, 'defines', json.defines );
      cmd.updatable = false;
      window.editor.execute(cmd);
    }

    if (JSON.stringify(currentObject.material.uniforms) !== JSON.stringify(json.uniforms)) {
      const cmd = new SetMaterialValueCommand(currentObject, 'uniforms', json.uniforms);
      cmd.updatable = false;
      window.editor.execute(cmd);
    }

    if (JSON.stringify(currentObject.material.attributes) !== JSON.stringify(json.attributes)) {
      const cmd = new SetMaterialValueCommand(currentObject, 'attributes', json.attributes);
      cmd.updatable = false;
      window.editor.execute(cmd);
    }

    show.value = false;
  }
}
</script>

<style scoped lang="less">
</style>