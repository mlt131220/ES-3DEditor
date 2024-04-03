import {reactive,toRefs} from "vue";
import { defineStore } from 'pinia';
import { useLocalStorageState } from 'vue-hooks-plus';
import { store } from '@/store';

interface IGlobalConfigState {
    theme: 'osTheme' |'lightTheme' | 'darkTheme';
    locale: string;
}

/**
 * 全局配置
 */
export const useGlobalConfigStore = defineStore('global-config',()=>{
    const [themeLocal, setThemeLocal] = useLocalStorageState<string>("theme", {
        defaultValue: "darkTheme",
    });

    const [localeLocal, setLocaleLocal] = useLocalStorageState<string>("es-locale", {
        defaultValue: "zh-CN"
    });

    const state = reactive<IGlobalConfigState>({
        theme: (themeLocal.value as 'osTheme' |'lightTheme' | 'darkTheme') || 'darkTheme',
        locale:localeLocal.value as string || 'zh-CN'
    })

    /**
     * actions
     **/
    const setTheme = (theme: 'osTheme' |'lightTheme' | 'darkTheme') => {
        setThemeLocal(theme);
        state.theme = theme ;
    }

    const setLocale = (locale: string) => {
        setLocaleLocal(locale);
        state.locale = locale;
    }

    return {
        ...toRefs(state),
        setTheme,
        setLocale
    }
});

// setup 之外使用
export function useGlobalConfigStoreWithOut() {
    return useGlobalConfigStore(store);
}