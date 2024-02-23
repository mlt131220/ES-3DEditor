declare interface ISceneInfo {
    id:number,
    // 场景分类  城市、园区、工厂、楼宇、设备、其他...
    type:string,
    // 场景名称
    name:string,
    // 场景描述
    introduction:string,
    // 场景版本
    version:number,
    // 是否是 cesium 场景
    isCesium:boolean
}