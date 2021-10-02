//主题
const theme: string = window.localStorage.getItem("theme") || 'default';
//语言
const locale: string = window.localStorage.getItem("locale") || 'zh-CN';

export type globalConfig = {
    theme:string,
    locale:string,
}

export default{
    theme,
    locale,
}