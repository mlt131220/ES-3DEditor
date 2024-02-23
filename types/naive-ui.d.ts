//naive ui 上传组件
declare interface UploadFileInfo {
    id: string | number,	//文件 id，需要唯一
    name: string,	//文件名
    status: string,	//'pending' | 'uploading' | 'error' | 'finished' | 'removed'	上传的状态
    percentage: number,	//文件上传进度百分比，在 uploading 状态下生效
    file?: File | null,	//文件对应的浏览器 File 对象
    thumbnailUrl?: string | null,	//缩略图 URL
    type?: string | null,	//MIME 类型
    url?: string | null
}
declare interface uploadOption {
    file: UploadFileInfo, 
    fileList: Array<UploadFileInfo>, 
    event?: Event
}
