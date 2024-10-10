/**
 * @author ErSan
 * @email  mlt131220@163.com
 * @date   2024/9/16 0:36
 * @description
 */
import { defineStore } from 'pinia';
import { store } from '@/store';
import {computed, reactive, toRefs} from "vue";

interface IPluginState {
    // 已安装（可用）插件的列表
    plugins:{[name:string]:IPlugin.Item}
}

export const usePluginStore = defineStore("plugin",() => {
    const state = reactive<IPluginState>({
        plugins:{}
    })

    const getPluginsList = () => computed(() => Object.values(state.plugins));

    return {
        ...toRefs(state),
        getPluginsList
    }
})

export function usePluginStoreWithOut() {
    return usePluginStore(store);
}