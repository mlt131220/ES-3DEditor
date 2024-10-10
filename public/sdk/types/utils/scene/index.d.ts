/**
 * 获取画布的截屏图片
 * @param canvas 画布对象
 * @returns Promise<HTMLImageElement> 截屏的图片对象
 */
export declare function getViewportImage(canvas: HTMLCanvasElement): Promise<HTMLImageElement>;
/**
 * 截屏并下载图片
 * @param canvas 画布对象
 * @param filename 图片文件名
 */
export declare function saveScreenCapture(canvas: HTMLCanvasElement, filename?: string): Promise<void>;
