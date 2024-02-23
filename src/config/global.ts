//主题
const theme: string = window.localStorage.getItem("theme") || 'darkTheme';
//语言
const locale: string = window.localStorage.getItem("locale") || 'zh-CN';

//是否属于演示环境
const demoEnv:boolean = import.meta.env.VITE_GLOB_DEMO_ENV === 'true';

const TYPED_ARRAYS = {
    Int8Array: Int8Array,
    Uint8Array: Uint8Array,
    Uint8ClampedArray: Uint8ClampedArray,
    Int16Array: Int16Array,
    Uint16Array: Uint16Array,
    Int32Array: Int32Array,
    Uint32Array: Uint32Array,
    Float32Array: Float32Array,
    Float64Array: Float64Array
};

// base64对应的类型
const BASE64_TYPES = {
    "data:image/png;base64": "png",
    "data:image/jpeg;base64": "jpg",
    "data:image/gif;base64": "gif",
    "data:image/x-icon;base64": "ico",
    "data:image/svg+xml;base64": "svg",
    "data:image/webp;base64": "webp",
    "data:audio/wav;base64": "wav",
    "data:audio/mpeg;base64": "mp3",
    "data:video/mp4;base64": "mp4",
    "data:video/webm;base64": "webm",
    "data:font/woff;base64": "woff",
    "data:font/woff2;base64": "woff2",
    "data:application/vnd.ms-fontobject;base64": "eot",
    "data:application/x-font-ttf;base64": "ttf",
    "data:application/octet-stream;base64": "ttf",
    "data:application/font-woff;base64": "woff",
    "data:application/font-woff2;base64": "woff2"
}

// 场景类型
const SCENE_TYPE = [
    {label:"城市",value:"城市"},
    {label:"园区",value:"园区"},
    {label:"工厂",value:"工厂"},
    {label:"楼宇",value:"楼宇"},
    {label:"设备",value:"设备"},
    {label:"其他",value:"其他"},
]

export type globalConfig = {
    theme:string,
    locale:string,
    demoEnv:boolean
}

export {
    theme,
    locale,
    demoEnv,
    TYPED_ARRAYS,
    BASE64_TYPES,
    SCENE_TYPE
}
