import {defineConfig, loadEnv} from 'vite';
import path from 'path';
import dotenv from "dotenv";

import {wrapperEnv, createPlugins} from "./build";

export default defineConfig(async ({mode, command}) => {
    const root = process.cwd();
    const env = loadEnv(mode, root);
    //LoadEnv读取的布尔类型是一个字符串。此函数可以转换为布尔类型
    const viteEnv = wrapperEnv(env);
    const {
        VITE_PORT,
        VITE_PUBLIC_PATH,
        VITE_BUILD_COMPRESS,
        VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE,
        VITE_ENABLE_ANALYZE
    } = viteEnv;

    const isBuild = command === 'build';
    const plugins = await createPlugins({
        isBuild,
        root,
        compress: {
            compress: VITE_BUILD_COMPRESS,
            deleteOriginFile: VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE,
        },
        enableAnalyze: VITE_ENABLE_ANALYZE,
    });

    const define:any = {
        "process.env": process.env
    };
    if (mode === "development") {
        dotenv.config({ path: ".env.development" });
        define.global = {};
    } else if (mode === "production") {
        dotenv.config({ path: ".env.production" });
    }

    return {
        define: define,
        base: VITE_PUBLIC_PATH,
        root,
        plugins,
        resolve: {
            alias: {
                // 设置路径
                '~': path.resolve(__dirname, './types'),
                // 设置别名
                '@': path.resolve(__dirname, './src'),
            },
            extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
        },
        optimizeDeps: {
            exclude: ['keyframe-resample','draco3dgltf'],
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
