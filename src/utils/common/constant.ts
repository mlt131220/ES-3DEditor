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