import * as THREE from "three";

declare interface SceneJsonImage{
    uuid:string,
    sceneId:string,
    url:string
}

declare interface SceneJsonGeometry{
    uuid:string,
    sceneId:string,
    geometry: { zip:string }
}

declare interface SceneJsonModel{
    uuid:string,
    sceneId:string,
    model: { zip:string }
}

declare interface TraverseWorkerData{
    status:string,
    models:Array<{
        uuid:string,
        sceneId:string,
        model: THREE.Object3D
    }>,
    images:Array<SceneJsonImage>,
    geometries:Array<{
        uuid:string,
        sceneId:string,
        geometry:THREE.BufferGeometry
    }>,
    message:string,
    sceneJson:{
        object:THREE.Object3D,
        images:Array<SceneJsonImage>,
        animations:Array<THREE.AnimationObjectGroup>,
        geometries:Array<THREE.BufferGeometry>,
        materials:Array<THREE.Material>,
        textures:Array<THREE.Texture>,
        modelTotal:number,//场景总模型数量
    }
}

declare namespace Service {
    /**
     * 请求的错误类型：
     * - axios: axios错误：网络错误, 请求超时, 默认的兜底错误
     * - http: 请求成功，响应的http状态码非200的错误
     * - backend: 请求成功，响应的http状态码为200，由后端定义的业务错误
     */
    type RequestErrorType = 'axios' | 'http' | 'backend';

    /** 请求错误 */
    interface RequestError {
        /** 请求服务的错误类型 */
        type: RequestErrorType;
        /** 错误码 */
        code: string | number;
        /** 错误信息 */
        msg: string;
    }

    /** 后端接口返回的数据结构配置 */
    interface BackendResultConfig {
        /** 表示后端请求状态码的属性字段 */
        codeKey: string;
        /** 表示后端请求数据的属性字段 */
        dataKey: string;
        /** 表示后端消息的属性字段 */
        msgKey: string;
        /** 后端业务上定义的成功请求的状态 */
        successCode: number | string;
    }

    /** 自定义的请求成功结果 */
    interface SuccessResult<T = any> {
        /** 请求错误 */
        error: null;
        /** 请求数据 */
        data: T;
    }

    /** 自定义的请求失败结果 */
    interface FailedResult {
        /** 请求错误 */
        error: RequestError;
        /** 请求数据 */
        data: null;
    }

    /** 自定义的请求结果 */
    type RequestResult<T = any> = SuccessResult<T> | FailedResult;

    /** 多个请求数据结果 */
    type MultiRequestResult<T extends any[]> = T extends [infer First, ...infer Rest]
        ? [First] extends [any]
            ? Rest extends any[]
                ? [Service.RequestResult<First>, ...MultiRequestResult<Rest>]
                : [Service.RequestResult<First>]
            : Rest extends any[]
                ? MultiRequestResult<Rest>
                : []
        : [];

    /** 请求结果的适配器函数 */
    type ServiceAdapter<T = any, A extends any[] = any> = (...args: A) => T;

    /* 列表分页查询后端返回的数据类型 */
    interface ListPageResult<T> {
        current:number;
        items:T[];
        pageSize:number;
        pages:number;
        total:number;
    }
}

declare interface WebSocketMessage<T>{
    /**
     * 消息类型
     * bim2gltf:bim模型轻量化 | message:普通消息 | error:错误信息
     * chatroom-join:加入聊天室 | chatroom-leave:离开聊天室 | chatroom-message:聊天室消息
     **/
    type:"bim2gltf" | "message" | "error" | "chatroom-join" | "chatroom-leave" | "chatroom-message",
    // 消息订阅者（uname）
    subscriber:string,
    data:T
}

declare interface Bim2GltfWsData{
    conversionStatus:"progress" | "completed" | "failed",
    item:IBIMData
}
