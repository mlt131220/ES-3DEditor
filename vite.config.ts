import {defineConfig, loadEnv} from 'vite';
import path from 'path';
import vue from '@vitejs/plugin-vue';
import {wrapperEnv} from './build/utils';

import Unocss from 'unocss/vite';
import {presetUno, presetAttributify, presetIcons} from 'unocss';
import cesium from 'vite-plugin-cesium';

import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig(({mode}) => {
    const root = process.cwd();

    const env = loadEnv(mode, root);

    //LoadEnv读取的布尔类型是一个字符串。此函数可以转换为布尔类型
    const viteEnv = wrapperEnv(env);

    const {VITE_PORT, VITE_PUBLIC_PATH} = viteEnv;

    return {
        base: VITE_PUBLIC_PATH,
        root,
        plugins: [vue(), Unocss({
            presets: [
                presetUno(),
                presetAttributify(),
                presetIcons()],
        }), cesium(),topLevelAwait({
            // 每个块模块的顶级await promise的导出名称
            promiseExportName: "__tla",
            // 用于在每个块模块中生成顶级await承诺的导入名称的函数
            promiseImportName: i => `__tla_${i}`
        })],
        resolve: {
            alias: {
                // 设置路径
                '~': path.resolve(__dirname, './'),
                // 设置别名
                '@': path.resolve(__dirname, './src'),
            },
            extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
        },
        server: {
            host: true,
            port: VITE_PORT,
            //设置 server.hmr.overlay 为 false 可以禁用开发服务器错误的屏蔽
            // hmr: { overlay: false },
            // 解决 ffmpeg 报错 SharedArrayBuffer is not defined
            headers: {
                'Cross-Origin-Embedder-Policy': 'require-corp',
                'Cross-Origin-Opener-Policy': 'same-origin',
            },
            proxy: {
                '^/api': {
                    target: env.VITE_PROXY_URL,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(new RegExp(`^/api`), '/api')
                },
                "^/upyun": {
                    target: env.VITE_UPYUN_URL,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(new RegExp(`^/upyun`), '')
                },
                '^/static/upload': {
                    target: env.VITE_UPYUN_URL,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(new RegExp(`^/static/upload`), '/static/upload')
                },
                '^/static/bim2gltf': {
                    target: env.VITE_UPYUN_URL,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(new RegExp(`^/static/bim2gltf`), '/static/bim2gltf')
                }
            }
        }
    }
})
