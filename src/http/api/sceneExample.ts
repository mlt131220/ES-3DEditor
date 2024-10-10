/**
 * @author MaHaiBing
 * @email  mlt131220@163.com
 * @date   2024/7/28 14:54
 * @description 示例场景
 */
import {request} from "@/http/request";
import {Service} from "~/network";

/**
 * 获取所有示例场景
 */
export function fetchSceneExampleList(params) {
    return request.get<Service.ListPageResult<ISceneFetchData>>("/editor3d/sceneExample",{params});
}

/**
 * 获取示例场景
 */
export function fetchSceneExample(id) {
    return request.get(`/editor3d/sceneExample/${id}`);
}

/**
 * 新增示例场景
 */
export function fetchAddSceneExample(data) {
    return request.post(`/editor3d/sceneExample`,data);
}

/**
 * 删除示例场景
 * @param {number} id
 */
export function fetchDeleteSceneExample(id: number) {
    return request.delete(`/editor3d/sceneExample/${id}`,{});
}