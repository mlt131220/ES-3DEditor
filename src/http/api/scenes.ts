import {request} from "@/http/request";

/**
 * 获取所有场景
 */
export function fetchGetAllScenes(params) {
    return request.get("/editor3d/scenes/getAll",{params});
}

/**
 * 获取单个贴图
 * @param {object} params {sceneId:string, uuid:string}
 */
export function fetchGetImage(params) {
    return request.get(`/editor3d/scenesImages/get`,{params});
}

/**
 * 获取单个几何信息
 * @param {object} params {sceneId:string, uuid:string}
 */
export function fetchGetGeometry(params) {
    return request.get(`/editor3d/scenesGeometry/get`,{params});
}

/**
 * 获取单个模型信息
 * @param {object} params {sceneId:string, uuid:string}
 */
export function fetchGetModel(params) {
    return request.get(`/editor3d/scenesModels/get`,{params});
}

/**
 * 删除场景（后端会同时删除相关贴图、模型、几何数据）
 * @param {object} params {sceneId:string}
 */
export function fetchDeleteScenes(params) {
    return request.delete(`/editor3d/scenes/del`,{params});
}
