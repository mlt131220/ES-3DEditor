import {request} from "@/http/request";

/**
 * 获取所有场景信息
 */
export function fetchGetAllScenes(params) {
    return request.get("/editor3d/scenes/zip/getAll",{params});
}

/**
 * 获取场景
 */
export function fetchGetOneScene(id) {
    return request.get(`/editor3d/scenes/zip/get/${id}`);
}

/**
 * 保存场景
 */
export function fetchSaveScene(data) {
    return request.post(`/editor3d/scenes/zip/add`,data);
}

/**
 * 删除场景
 * @param {string} id
 */
export function fetchDeleteScenes(id) {
    return request.delete(`/editor3d/scenes/zip/del/${id}`,{});
}