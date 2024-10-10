// @ts-ignore
import ConfigPlugin from 'unplugin-config/vite';
import { type PluginOption } from 'vite';
import {strToHex} from "../../src/utils/common/color";
import {getEnvConfig} from "../utils";

/**
 * 在生产环境中输入的配置文件的名称
 */
export const GLOBAL_CONFIG_FILE_NAME = '_es3d.config.js';

export const OUTPUT_DIR = 'dist';

export async function createConfigPluginConfig(
    shouldGenerateConfig: boolean,
): Promise<PluginOption> {
    const config:Record<string, any> = await getEnvConfig();
    const APP_NAME = strToHex(config?.VITE_GLOB_APP_TITLE ?? '__APP');
    // https://github.com/kirklin/unplugin-config
    return ConfigPlugin({
        appName: APP_NAME,
        baseDir:"./",
        envVariables: {
            prefix: 'VITE_GLOB_',
        },
        configFile: {
            generate: shouldGenerateConfig,
            fileName: GLOBAL_CONFIG_FILE_NAME,
            outputDir: OUTPUT_DIR,
        },
        htmlInjection: {
            decodeEntities: true,
        },
    });
}