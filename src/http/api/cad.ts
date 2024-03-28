import {request} from "@/http/request";
import {Service} from "../../../types/network";
import {useWebsocketStore} from "@/store/modules/websocket";

const websocketStore = useWebsocketStore();

/**
 * 获取cad列表
 */
export function fetchGetCadList(params) {
    return request.get<Service.ListPageResult<ICad.IData>>('/editor3d/cad/getAll',{params});
}

/**
 * 添加数据并启动cad解析（ 需传入接收结果的websocket uname）
 */
export function fetchAddDwg2dxf(data) {
    return request.post('/editor3d/cad/dwg2dxf',data,{params:{uname:websocketStore.uname},headers:{"Content-Type":"multipart/form-data"}});
}