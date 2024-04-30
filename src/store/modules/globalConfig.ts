import { defineStore } from 'pinia';
import {darkTheme, useOsTheme} from "naive-ui";
import type { GlobalTheme } from 'naive-ui';
import { useLocalStorageState } from 'vue-hooks-plus';
import { store } from '@/store';
import { generate } from '@ant-design/colors'

const osThemeRef = useOsTheme();

/**
 * 全局配置
 */
export const useGlobalConfigStore = defineStore('global-config',()=>{
    const [themeLocal, setThemeLocal] = useLocalStorageState<IConfig.Theme>("es-theme", {
        defaultValue: "darkTheme",
    });
    const getProviderTheme = ():GlobalTheme => <GlobalTheme>(themeLocal.value === 'osTheme' ? (osThemeRef.value === 'dark' ? darkTheme : null) : themeLocal.value === 'lightTheme'? null : darkTheme);
    const themeLink = {
        'osTheme':{
            next:'lightTheme',
            prev:'darkTheme'
        },
        'lightTheme':{
            next:'darkTheme',
            prev:'osTheme'
        },
        'darkTheme':{
            next:'osTheme',
            prev:'lightTheme'
        }
    }
    const setTheme = () => {
        const current = themeLocal.value || 'darkTheme';
        setThemeLocal(<IConfig.Theme>themeLink[current].next);
    }

    const [localeLocal, setLocaleLocal] = useLocalStorageState<IConfig.Locale>("es-locale", {
        defaultValue: "zh-CN"
    });

    const [mainColor, setMainColor] = useLocalStorageState<IConfig.Color>("es-main-color", {
        defaultValue: {
            "CMYK": [56, 0, 19, 11],
            "RGB": [99, 226, 183],
            "hex": "#63E2B7",
            "hexHover": "#7FE7C4",
            "hexPressed": "#5ACEA7",
            "hexSuppl": "#2A947D",
            "name": "\u9e23\u7fe0\u67f3",
            "pinyin": "mingcuiliu"
        }
    });
    const setPrimaryColor = (color:IConfig.Color) => {
        const colors = generate(color.hex);

        color.hexHover = colors[4] // Hover浅一些，取第5个颜色
        color.hexSuppl = colors[6] // 比主色深一档，取第7个颜色
        color.hexPressed = colors[7]

        setMainColor(color)
    }

    return {
        theme:themeLocal,
        locale:localeLocal,
        mainColor,
        getProviderTheme,
        setTheme,
        setLocale:setLocaleLocal,
        setPrimaryColor
    }
});

// setup 之外使用
export function useGlobalConfigStoreWithOut() {
    return useGlobalConfigStore(store);
}