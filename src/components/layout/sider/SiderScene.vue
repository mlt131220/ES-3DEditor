<script lang="ts" setup>
import { ref, inject } from "vue";
import { NCard, NInput, NTree, NForm, NFormItem, NSelect, NColorPicker, NUpload, NInputNumber, NTabs, NTabPane } from "naive-ui";
import { uploadOption } from "../../../type/sider"

const pattern = ref("");
const sceneTreeData = ref([
    {
        label: "Camera",
        key: "camera",
        // children: []
    },
    {
        label: "Scene",
        key: "scene",
        // children: []
    }
]);

//背景
const backgroundSelect = ref("")
const background = ref("")
//环境
const environmentSelect = ref("");
const environment = ref("")
//雾
const fogSelect = ref("")
const fog = ref("");
const linearNumber1 = ref(0.10);
const linearNumber2 = ref(50.00);
const exponentialNumber = ref(0.05);

const t: any = inject("t");

/**
 * 背景选择图片改变事件
 * 只留取最后一张图片
*/
const uploadChange = (options: uploadOption) => {
    if (options.fileList.length > 1) {
        options.fileList.shift();
    }
}
</script>

<template>
    <div class="scene-top">
        <n-card hoverable>
            <n-input v-model:value="pattern" :placeholder="t('layout.sider.scene.search')" />
            <n-tree :pattern="pattern" :data="sceneTreeData" virtual-scroll block-line />
        </n-card>

        <n-form label-placement="left" :label-width="60" label-align="left" size="small">
            <n-form-item :label="t('layout.sider.scene.Background')">
                <n-select
                    v-model:value="backgroundSelect"
                    :options="[{ label: 'Color', value: 'color' }, { label: 'Texture', value: 'texture' }, { label: 'Equirect', value: 'equirect' }]"
                />
                <n-color-picker
                    v-if="backgroundSelect === 'color'"
                    v-model:value="background"
                    :show-alpha="false"
                />
            </n-form-item>
            <n-upload
                v-if="backgroundSelect === 'texture' || backgroundSelect === 'equirect'"
                list-type="image-card"
                :default-upload="false"
                @change="uploadChange"
            >{{ t('layout.sider.scene["Click Upload"]') }}</n-upload>

            <n-form-item :label="t('layout.sider.scene.Environment')">
                <n-select
                    v-model:value="environmentSelect"
                    :options="[{ label: 'Equirect', value: 'equirect' }, { label: 'Modelviewer', value: 'modelviewer' }]"
                />
            </n-form-item>
            <n-upload
                v-if="environmentSelect === 'equirect'"
                list-type="image-card"
                :default-upload="false"
                @change="uploadChange"
            >{{ t('layout.sider.scene["Click Upload"]') }}</n-upload>

            <n-form-item :label="t('layout.sider.scene.Fog')">
                <n-select
                    v-model:value="fogSelect"
                    :options="[{ label: 'Linear', value: 'linear' }, { label: 'Exponential', value: 'exponential' }]"
                />
            </n-form-item>

            <div class="fog-select-color-picker">
                <n-color-picker v-if="fogSelect !== ''" v-model:value="fog" :show-alpha="false" />
                <n-input-number
                    v-if="fogSelect === 'linear'"
                    v-model:value="linearNumber1"
                    min="0.00"
                    size="small"
                    step="0.01"
                />
                <n-input-number
                    v-if="fogSelect === 'linear'"
                    v-model:value="linearNumber2"
                    min="0.00"
                    size="small"
                    step="0.01"
                />

                <n-input-number
                    v-if="fogSelect === 'exponential'"
                    v-model:value="exponentialNumber"
                    min="0.00"
                    max="0.100"
                    size="small"
                    step="0.001"
                />
            </div>
        </n-form>
    </div>
    <n-tabs default-value="scene" justify-content="space-evenly" type="segment">
        <n-tab-pane name="scene" :tab="t('layout.sider.scene.Object')"></n-tab-pane>
        <n-tab-pane name="project" :tab="t('layout.sider.scene.Geometry')"></n-tab-pane>
        <n-tab-pane name="sky box" :tab="t('layout.sider.scene.Material')"></n-tab-pane>
    </n-tabs>
</template>

<style lang="scss" scoped>
.scene-top {
    padding: 0 1rem;

    .n-card {
        :deep(.n-card__content) {
            padding: 0.5rem;
        }
        .n-input {
            margin-bottom: 0.5rem;
        }
        .n-tree {
            height: 13rem;
        }
    }

    .n-form {
        margin-top: 0.5rem;

        :deep(.n-form-item-feedback-wrapper) {
            min-height: 0.25rem;
        }

        .n-upload {
            margin-left: 1rem;
            margin-bottom: 0.5rem;
        }

        .fog-select-color-picker {
            display: flex;
            justify-content: space-between;

            .n-color-picker {
                height: 28px;
                max-width: 6rem;
            }

            .n-input-number {
                max-width: 8rem;
            }
        }
    }
}

.n-tabs {
    :deep(.n-tabs-rail) {
        flex-wrap: wrap;

        .n-tabs-tab-wrapper{
            min-width: 33%;
            flex-basis:auto;
        }
    }
}
</style>