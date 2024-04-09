/**
 * @author ErSan
 * @email  mlt131220@163.com
 * @date   2024/3/26 9:57
 * @description 全局常量
 */
// 支持的模型格式
export const MODEL_SUPPORT_TYPE = [
    // 普通模型格式
    "gltf","glb","fbx","obj","mtl",
    "3dm","3ds",
    "3mf","amf",
    "dae","drc",
    "kmz","ldr",
    "mpd","md2",
    "pcd","ply",
    "stl","svg",
    "usdz","vox","vtk","vtp",
    "wrl",
    "xyz",
    "json","zip",
    // 自解析格式
    "rvt","rfa","ifc",
    "3DTiles","osgb",
    "rvm",
    // "dgn",
    /*"jt"*/
    // "shp",
    // "stp","step"
];

// 需要转换的模型格式
export const NEED_CONVERT_MODEL = ["rvt", "rfa","rvm"];

// 支持的图纸文件类型
export const DRAWING_SUPPORT_TYPE = ["dwg", "dxf", "png", "jpg", "jpeg"];

// 需要转换的图纸格式
export const NEED_CONVERT_DRAWING = ["dwg"];

// 支持的文档类型
export const DOC_SUPPORT_TYPE = ["doc","docx","xls","xlsx","xlsm","ppt",'pptx',"pdf","txt"];

export const demoEnv:boolean = import.meta.env.VITE_GLOB_DEMO_ENV === 'true';

export const TYPED_ARRAYS = {
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

export const BASE64_TYPES = {
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

export const SCENE_TYPE = [
    {label:"城市",value:"城市"},
    {label:"园区",value:"园区"},
    {label:"工厂",value:"工厂"},
    {label:"楼宇",value:"楼宇"},
    {label:"设备",value:"设备"},
    {label:"其他",value:"其他"},
]

export const GRID_COLORS_LIGHT = [ 0x999999, 0x777777 ]
export const GRID_COLORS_DARK =  [ 0x555555, 0x888888 ];