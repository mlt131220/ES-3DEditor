import {request} from "@/http/request";
import {useWebsocketStore} from "@/store/modules/websocket";

const websocketStore = useWebsocketStore();

/**
 * 获取bim转换列表
 */
export function fetchGetBim2GltfList(params) {
    return request.get('/editor3d/bim2gltf/getAll',{params});
}

/**
 * 上传bim文件
 */
export function fetchUploadRvt(data) {
    return request.post('/editor3d//bim2gltf/uploadRvt',data,{headers:{"Content-Type":"multipart/form-data"}});
}

/**
 * 添加数据并启动revit转换（ 需传入接收结果的websocket uname）
 */
export function fetchAddBim2Gltf(data) {
    return request.post('/editor3d/bim2gltf/addAndConversion',data,{params:{uname:websocketStore.uname}});
}