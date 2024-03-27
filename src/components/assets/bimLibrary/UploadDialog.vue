<template>
  <n-modal :show="show" @update:show="(b) => emits('update:show',b)" class="!w-500px" preset="card" :title="t('bim[\'BIM lightweight\']')">
    <n-form label-placement="left" :model="BIMModel" :rules="BIMRules"
            label-width="100px" label-align="right" ref="formRef"
            require-mark-placement="right-hanging">
      <!--      <n-form-item :label="t('bim[\'File name\']')" path="fileName">-->
      <!--        <n-input v-model:value="BIMModel.fileName"-->
      <!--                 :placeholder="t('bim[\'Please enter the BIM file name\']')"/>-->
      <!--      </n-form-item>-->
      <n-form-item :label="t('bim.Thumbnail')">
        <n-upload :default-upload="false" list-type="image-card" :max="1"
                  @change="thumbnailChange"/>
      </n-form-item>
      <n-form-item :label="t('bim[\'BIM file\']')" path="bimFile">
        <n-upload ref="uploadBIMRef" :default-upload="false" directory-dnd :max="1"
                  :accept="'.' + NEED_CONVERT_MODEL.join(',.')" @change="bimChange">
          <n-upload-dragger>
            <div>
              <n-icon size="48" :depth="3">
                <ArchiveOutline/>
              </n-icon>
            </div>
            <n-text style="font-size: 14px">
              {{
                t("bim['Click or drag the file to this area.Supported formats are:']") + ` ${NEED_CONVERT_MODEL.join("、")}`
              }}
            </n-text>
          </n-upload-dragger>
        </n-upload>
      </n-form-item>
      <n-collapse>
        <template #arrow>
          <n-icon>
            <CaretForwardOutline />
          </n-icon>
        </template>

        <n-collapse-item :title="t('bim[\'Conversion configuration\']')">
          <!--  极致轻量化 -->
          <n-form-item :label="t('bim[\'Extreme lightweight\']')">
            <n-switch v-model:value="BIMModel.options.Optimize" />
          </n-form-item>
          <!--  导出属性 -->
          <n-form-item :label="t('bim[\'Export Property\']')">
            <n-switch v-model:value="BIMModel.options.ExportProperty" />
          </n-form-item>
          <!--  转换视图 -->
          <n-form-item :label="t('bim[\'Conversion view\']')">
            <n-radio-group v-model:value="BIMModel.options.View" name="View">
              <n-radio-button value="Default">默认3D视图</n-radio-button>
              <n-radio-button value="Name">按名称</n-radio-button>
            </n-radio-group>
          </n-form-item>
          <!--  视图名称 -->
          <n-form-item :label="t('bim[\'View name\']')" v-if="BIMModel.options.View === 'Name'">
            <n-input v-model:value="BIMModel.options.ViewName" :placeholder="t('bim[\'Please enter the conversion view name\']')"/>
          </n-form-item>
          <!--  视觉样式 -->
          <n-form-item :label="t('bim[\'Display style\']')">
            <n-radio-group v-model:value="BIMModel.options.DisplayStyle" name="DisplayStyle">
              <n-radio-button value="Colour">{{t("bim.Colour")}}</n-radio-button>
              <n-radio-button value="Realistic">{{t("bim.Realistic")}}</n-radio-button>
              <n-radio-button value="ViewDefault">{{t("bim['View default']")}}</n-radio-button>
            </n-radio-group>
          </n-form-item>
          <!--  坐标参考 -->
          <n-form-item :label="t('bim[\'Coordinate reference\']')">
            <n-radio-group v-model:value="BIMModel.options.CoordinateReference" name="CoordinateReference">
              <n-radio-button value="Origin">{{t("bim.Origin")}}</n-radio-button>
              <n-radio-button value="ProjectBasePoint">{{t("bim['Project base point']")}}</n-radio-button>
              <n-radio-button value="MeasuringPoint">{{t("bim['Measuring point']")}}</n-radio-button>
            </n-radio-group>
          </n-form-item>
        </n-collapse-item>
      </n-collapse>
    </n-form>

    <div class="flex justify-end">
      <n-button round type="primary" @click="submit">{{ t("bim['Upload and lightweight']") }}</n-button>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import {reactive, ref} from "vue";
import {NotificationReactive} from "naive-ui";
import {t} from "@/language";
import {ArchiveOutline, CaretForwardOutline} from "@vicons/ionicons5";
import {demoEnv} from "@/config/global";
import {fetchUpload} from "@/http/api/sys";
import {fetchAddBim2Gltf, fetchUploadRvt} from "@/http/api/bim";
import {NEED_CONVERT_MODEL} from "@/utils/common/constant";

withDefaults(defineProps<{
  show:boolean
}>(),{
  show:false
})

const emits = defineEmits(["update:show"]);

const formRef = ref();
const uploadBIMRef = ref();

/* bim文件上传转换 */
const BIMModel = reactive<{
  fileName: string,
  thumbnail: File | null,
  bimFile: File | null,
  options:{
    // 极致压缩率（会执行实例化网格，破坏模型结构）
    Optimize:boolean,
    // 是否导出属性
    ExportProperty:boolean,
    // 转换视图 - Default：默认3D视图 | Name：按传入名称查找视图
    View:string,
    // 转换视图名称 - View = "Name"时输入有效
    ViewName:string,
    // 转换视觉样式 - Colour:着色模式 | Realistic-真实模式 | ViewDefault-视图默认
    DisplayStyle:string,
    // 坐标参考 - Origin:默认原点 | ProjectBasePoint：项目基点 | MeasuringPoint：测量点
    CoordinateReference:string
  }
}>({
  fileName: "",
  thumbnail: null,
  bimFile: null,
  options:{
    Optimize:false,
    ExportProperty:true,
    View:"Default",
    ViewName:"",
    DisplayStyle:"Colour",
    CoordinateReference:"Origin"
  }
})
const BIMRules = {
  bimFile: {
    required: true,
    trigger: 'change',
    validator: (rule, value) => {
      return new Promise<void>((resolve, reject) => {
        // 判断value是否是File类型
        if (value === '' || !(value instanceof File)) {
          reject(Error(t("bim['Please upload the BIM file']")))
        } else {
          resolve()
        }
      })
    }
  }
}

// 预览图变化
function thumbnailChange({file}) {
  if (file.status === "removed") {
    BIMModel.thumbnail = null;
    return;
  }
  BIMModel.thumbnail = file.file as File;
}

// bim文件选择变化
function bimChange({file}) {
  if (file.status === "removed") {
    BIMModel.bimFile = null;
    formRef.value?.validate();
    return;
  }

  if (!NEED_CONVERT_MODEL.includes(file.name.split(".").at(-1).toLowerCase())) {
    window.$message?.error(t("bim['This format is not supported for lightweight, please upload again! Supported formats are:']") + ` ${NEED_CONVERT_MODEL.join("、")}`);
    uploadBIMRef.value.clear();
    return false
  }

  BIMModel.bimFile = file.file as File;
  BIMModel.fileName = BIMModel.bimFile.name;
  formRef.value?.validate();
}

// ws 监听使用的notice
let wsNotice: null | NotificationReactive = null;
const getNotice = () => wsNotice;
// 提交
function submit(e) {
  if (demoEnv) {
    window.$message?.error(window.$t("prompt['Disable this function in the demonstration environment!']"));
    return;
  }

  e.preventDefault();
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      emits("update:show",false);

      wsNotice = window.$notification.info({
        title: t("bim['BIM lightweight']"),
        content: t("prompt.Uploading") + "...",
        closable: false,
      })

      // 1. 上传缩略图
      let thumbnail = "";
      if (BIMModel.thumbnail) {
        const res = await fetchUpload({
          file: BIMModel.thumbnail,
          biz: "bim/thumbnail"
        })

        if (res.data === null) {
          window.$message?.error(t("bim['Failed to upload thumbnail']"));
        } else {
          thumbnail = res.data as string;
        }
      }

      // 2. 上传bim文件
      const bimRes = await fetchUploadRvt({
        file: BIMModel.bimFile,
      });
      if (bimRes.data === null) {
        window.$message?.error(t("bim['Failed to upload BIM file']"));
        wsNotice.content = `${t("bim['Failed to upload BIM file']")},${t("prompt['Please try again later!']")}`;
        setTimeout(() => {
          wsNotice?.destroy();
        }, 1000)
        return;
      }

      //3 启动Revit轻量化服务
      wsNotice.content = t("bim['BIM lightweight is in progress']") + "...";
      await fetchAddBim2Gltf({
        bimFilePath: bimRes.data,
        bimFileSize: (BIMModel.bimFile as File).size,
        fileName: BIMModel.fileName,
        fileSourceIp: "",
        thumbnail,
        conversionStatus: 0,
        // 转换配置
        options:BIMModel.options
      })

      // reset
      BIMModel.fileName = "";
      BIMModel.thumbnail = null;
      BIMModel.bimFile = null;
      BIMModel.options = {
        Optimize:false,
        ExportProperty:true,
        View:"Default",
        ViewName:"",
        DisplayStyle:"Colour",
        CoordinateReference:"Origin"
      }
    }
  })
}

defineExpose({getNotice})
</script>

<style scoped lang="less">
.n-form-item{
  margin-bottom: 10px;
}
</style>