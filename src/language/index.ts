import type { App } from 'vue';
import { computed,ComputedRef } from 'vue';
import { createI18n } from 'vue-i18n';
import {locale as GlobalConfigLocale} from '../config/global';
import {useDispatchSignal} from "@/hooks/useSignal";

//引入同级目录下所有语言文件
const modules = (import.meta as any).glob('./*.ts', {eager: true});

type Message = {
    [s: string]: {} | undefined
}
type ReturnMessage = {
    'zh-CN': {},
    'en-US': {},
    [s: string]: {}
}
const getLangAll = (): ReturnMessage => {
    let message: Message = {};
    getLangFiles(modules, message);
    return message as ReturnMessage;
}

type LangFilesList = {
    [s: string]: { default: { [s: string]: string } }
}
/**
 * 获取所有语言文件
 * @param {Object} langFilesList
 * @param {Object} msg
 */
const getLangFiles = (langFilesList: LangFilesList, msg: Message) => {
    for (let path in langFilesList) {
        if (langFilesList[path].default) {
            //判断中英文混合文件是否存在
            if (/zh-CN-en-US/.test(path)) {
                type LocaleObj = {
                    [s: string]: any
                }

                let localeObj: LocaleObj = {
                    'zh-CN': langFilesList[path].default,
                    'en-US': {}
                }

                let enUSLangList = JSON.parse(JSON.stringify(langFilesList[path].default));
                recursionSetLeaf(enUSLangList);
                localeObj['en-US'] = enUSLangList;

                // 合并
                for (let i in localeObj) {
                    msg[i] = msg[i] ? {
                        ...msg[i],
                        ...localeObj[i]
                    } : localeObj[i];
                }
            } else {
                //获取文件名
                const fileName = path.substr(path.lastIndexOf('/') + 1, 5);

                msg[fileName] = msg[fileName] ? {
                    ...langFilesList[fileName],
                    ...langFilesList[path].default
                } : langFilesList[path].default;
            }

        }
    }
}

type LangObj = {
    [propName:string]:any
}
/**
 * 递归设置叶子节点的值为键名，即英文
 * @param {LangObj} obj
 *
 */
const recursionSetLeaf = (obj:LangObj) =>{
    for (let i in obj) {
        if(typeof obj[i] === 'string'){
            obj[i] = i;
        }else{
            recursionSetLeaf(obj[i]);
        }
    }
}

//注册i8n实例并引入语言文件
const i18n = createI18n({
    legacy: false,
    locale: GlobalConfigLocale,
    messages: getLangAll(),
    sync: true
})

//ts/js文件中使用
window.$t = i18n.global.t;
window.$cpt = (key: string):ComputedRef<string> => computed(() => i18n.global.t(key));

export function setupI18n(app: App) {
    app.use(i18n);
}

export function t(key: string):string {
    return i18n.global.t(key);
}

export function cpt(key: string): ComputedRef<string> {
    return computed(() => i18n.global.t(key));
}

export function setLocale(locale: 'zh-CN' | 'en-US') {
    i18n.global.locale.value = locale;
    localStorage.setItem('locale', locale);
    useDispatchSignal("changeLocaleLanguage",locale)
}
