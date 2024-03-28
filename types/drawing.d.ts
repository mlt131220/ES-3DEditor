declare interface IDrawingMark {
    x: number,
    y: number,
    w: number,
    h: number,
    color?:string,
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

    interface IData {
        id:number,
        fileName :string,
        thumbnail:string,
        filePath:string,
        converterFilePath:string,
        conversionStatus :number,
        createTime :string,
    }
}