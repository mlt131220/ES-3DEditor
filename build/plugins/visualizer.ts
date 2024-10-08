/**
 * package.json包文件容量分析
 */
// @ts-ignore
import {visualizer} from 'rollup-plugin-visualizer';
import { type PluginOption } from 'vite';

export function configVisualizerConfig() {
    return visualizer({
        filename: 'node_modules/.cache/visualizer/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
    }) as PluginOption;
}