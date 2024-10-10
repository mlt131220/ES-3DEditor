import {type PluginOption} from 'vite';
import vue from '@vitejs/plugin-vue';
import Unocss from 'unocss/vite';
import cesium from 'vite-plugin-cesium';
import {presetUno, presetAttributify, presetIcons} from 'unocss';
import topLevelAwait from "vite-plugin-top-level-await";
// 自动按需引入Naive UI组件
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import mkcert from 'vite-plugin-mkcert';
import EnhanceLog from 'vite-plugin-enhance-log';

import {createConfigPluginConfig} from "./appConfig";
import {configCompressPlugin} from "./compress";
import {configVisualizerConfig} from "./visualizer";

interface Options {
    isBuild: boolean;
    root: string;
    compress: {
        compress: "gzip" | "brotli" | "none";
        deleteOriginFile: boolean;
    };
    enableAnalyze?: boolean;
}

export async function createPlugins({isBuild,compress,enableAnalyze}: Options) {
    const vitePlugins: (PluginOption | PluginOption[])[] = [
        vue(),
        Unocss({
            presets: [
                presetUno(),
                presetAttributify(),
                presetIcons()],
        }),
        cesium(),
        topLevelAwait({
            // 每个块模块的顶级await promise的导出名称
            promiseExportName: "__tla",
            // 用于在每个块模块中生成顶级await承诺的导入名称的函数
            promiseImportName: i => `__tla_${i}`
        }),
        Components({
            resolvers: [NaiveUiResolver()]
        }),
        EnhanceLog({
            /** 高亮文件名（firefox不支持） */
            colorFileName: true,
            splitBy: '\n',
            preTip: '🚀🚀🚀🚀🚀🚀',
            enableFileName: { enableDir: false}
        }),
        // 本地开发https证书
        mkcert()
    ];

    const appConfigPlugin = await createConfigPluginConfig(isBuild);
    vitePlugins.push(appConfigPlugin);

    // 以下插件只在生产环境中工作
    if (isBuild) {
        // rollup-plugin-gzip
        vitePlugins.push(configCompressPlugin(compress));
    }

    // 打包视图分析 rollup-plugin-visualizer
    if (enableAnalyze) {
        vitePlugins.push(configVisualizerConfig());
    }

    return vitePlugins;
}