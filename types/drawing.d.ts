declare interface IDrawingMark {
    x: number,
    y: number,
    w: number,
    h: number,
    color:string,
    modelUuid?: string,
    modelPath?: string
}

declare interface IDrawingImgInfo {
    width: number,
    height: number
}

declare namespace ICad{
    interface IDxfLayer{
        name: string,
        color: number,
        colorIndex: number,
        frozen: boolean, // 冻结
        visible: boolean,
        //entities: any[]
    }

    interface IDxfLayers{
        [name:string]: IDxfLayer
    }

    interface IDrawRect {
        id?:number,
        x: number,
        y: number,
        w: number,
        h: number,
        color?:string,
        name:string, // 标记名称
        elementId?: string, // 图纸热点关联的内部模型uuid,modelUuid
        drawingModelId?: number, // 图纸文件id
        fileDictInstanceId?:number, // 模型热点关联数据行id
        instanceId?:number,  // 关联的实例树id
    }
}