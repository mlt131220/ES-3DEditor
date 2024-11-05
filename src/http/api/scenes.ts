import {request} from "@/http/request";
import {Service} from "~/network";

/**
 * 获取所有工程信息
 */
export function fetchGetAllScenes(params) {
    return request.get<Service.ListPageResult<ISceneFetchData>>("/editor3d/scenes/getAll",{params});
}

/**
 * 获取工程
 */
export function fetchGetOneScene(id:string) {
    return request.get<ISceneFetchData>(`/editor3d/scenes/get/${id}`);
}

/**
 * 保存工程
 */
export function fetchAddScene(data) {
    return request.post<ISceneFetchData>(`/editor3d/scenes/add`,data);
}

/**
 * 更新工程
 */
export function fetchUpdateScene(id:string,data:ISceneFetchData) {
    return request.put<ISceneFetchData>(`/editor3d/scenes/update/${id}`,data);
}

/**
 * 删除工程
 * @param {number} id
 */
export function fetchDeleteScenes(id: string) {
    return request.delete(`/editor3d/scenes/del/${id}`,{});
}