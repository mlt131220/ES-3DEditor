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