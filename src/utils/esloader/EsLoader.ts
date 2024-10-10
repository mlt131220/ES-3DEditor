import JSZip from "jszip";
import {BASE64_TYPES, TYPED_ARRAYS} from "@/utils/common/constant";
import {useDispatchSignal} from "@/hooks/useSignal";
import {unzip, zip} from "@/utils/common/pako";

interface SourceData {
    name: string;
    json?: string;
    texture?: string | ArrayBuffer;
    geometry?: string;
    drawing?: string;
}

export class EsLoader {
    private jszip: JSZip;
    private imgFolder: JSZip;
    private drawingFolder: JSZip;
    private geometriesFolder: JSZip;

    constructor() {
        this.jszip = new JSZip();
        this.imgFolder = this.jszip.folder("Textures") as JSZip;
        this.drawingFolder = this.jszip.folder("Drawing") as JSZip;
        this.geometriesFolder = this.jszip.folder("Geometries") as JSZip;
    }

    // 处理几何数据json
    private handleGeometryJson(arr) {
        function handler(value) {
            if (value instanceof Array) {
                return zip(value,false);
            }
            return value;
        }

        return arr.map((geometry) => {
            if (geometry.data) {
                const data = geometry.data;
                if (data.attributes) {
                    for (let key in data.attributes) {
                        data.attributes[key].array = handler(data.attributes[key].array);
                    }
                }
                if(data.index) {
                    data.index.array = handler(data.index.array);
                }
            }
            return geometry;
        })
    }

    // 开始打包
    public pack(editorJson, onComplete?: (zip: Blob) => void) {
        let esData: SourceData[] = [];

        const sceneJson = editorJson.scene;

        // 将所有贴图取出 单独存储
        if (sceneJson.images) {
            sceneJson.images = sceneJson.images.map((item) => {
                if (typeof item.url === "string") {
                    const name = item.uuid + `.${BASE64_TYPES[item.url.split(",")[0]]}`;
                    const content = item.url;
                    esData.push({name, texture: content});
                    return name;
                }

                const name = `${item.url.type}!${item.url.width}!${item.url.height}!${item.uuid}.env`;
                const buffer = new TYPED_ARRAYS[item.url.type](item.url.data);
                esData.push({name, texture: buffer.buffer});
                return name;
            })
        }

        // 将所有几何数据取出 单独存储
        if (sceneJson.geometries) {
            // 为避免数据量过大超过V8引擎对于字符串2^32的限制，分为多个切片（10个几何数据为一组）
            const transferNum = Math.ceil(sceneJson.geometries.length / 10);
            for (let i = 0; i < transferNum; i++) {
                const name = `geometries_${i}.json`;
                const geometry = JSON.stringify(this.handleGeometryJson(sceneJson.geometries.slice(i * 10, (i + 1) * 10)));
                esData.push({name, geometry});
            }
            sceneJson.geometries = [];
        }

        // 图纸
        if (editorJson.drawingInfo) {
            // 图片
            esData.push({
                name: editorJson.sceneInfo.sceneId + `.${BASE64_TYPES[editorJson.drawingInfo.imgSrc.split(",")[0]]}`,
                drawing: editorJson.drawingInfo.imgSrc
            });

            // 标记
            esData.push({name: "drawingMark.txt", drawing: editorJson.drawingInfo.markList});

            // 图片信息(宽高信息等，以便于其他地方使用可计算标记左上距离百分比)
            esData.push({name: "drawingImgInfo.json", drawing: editorJson.drawingInfo.imgInfo});

            editorJson.drawingInfo = null;
        }

        // 解包时需要还原的编辑器场景信息
        editorJson.metadata = window.editor.metadata;

        esData.push({name: "scene.json", json: JSON.stringify(editorJson)});
        this.zip(esData, (zip) => {
            onComplete && onComplete(zip);

        });
    }

    private async zip(sourceData: SourceData[], onComplete: (zip: Blob) => void) {
        useDispatchSignal("setGlobalLoadingText", window.$t("scene['Scene is being compressed...']"));

        let geometryData: SourceData[] = [];
        sourceData.forEach((item) => {
            if (item.texture) {
                this.imgFolder.file(item.name, item.texture, {
                    compression: "DEFLATE",//"STORE",//"DEFLATE
                    compressionOptions: {
                        level: 9
                    }
                });
            } else if (item.geometry) {
                geometryData.push(item);
            } else if (item.json) {
                this.jszip.file(item.name, item.json, {
                    compression: "DEFLATE",//"STORE",//"DEFLATE
                    compressionOptions: {
                        level: 9
                    }
                });
            } else if (item.drawing) {
                this.drawingFolder.file(item.name, item.drawing, {
                    compression: "DEFLATE",//"STORE",//"DEFLATE
                    compressionOptions: {
                        level: 9
                    }
                });
            }
        })

        if (geometryData.length > 0) {
            await this.zipGeometry(geometryData);
        }

        const content = await this.jszip.generateAsync({type: 'blob'});

        onComplete(content);
    }

    /**
     * geometry切片打包
     * @param {Array} geometryData geometry数据数组
     */
    private async zipGeometry(geometryData) {
        // 把geometryData按10一组的长度分割为新array
        const geometryDataArray: any[] = [];
        for (let i = 0; i < geometryData.length; i += 10) {
            geometryDataArray.push(geometryData.slice(i, i + 10));
        }

        // 逐个打包
        for (let i = 0; i < geometryDataArray.length; i++) {
            const jszip = new JSZip();
            geometryDataArray[i].forEach(item => {
                jszip.file(item.name, item.geometry, {
                    compression: "DEFLATE",//"STORE",//"DEFLATE
                    compressionOptions: {
                        level: 9
                    }
                });
            })
            const zip = await jszip.generateAsync({type: 'blob'});
            this.geometriesFolder.file(`geometries_${i}.zip`, zip, {
                compression: "DEFLATE",//"STORE",//"DEFLATE
                compressionOptions: {
                    level: 9
                }
            });
        }
    }

    /**
     * unGzipGeometryJson 还原几何数据
     * @param arr
     * @private
     */
    private unGzipGeometryJson(arr) {
        // 几何数据array 还原
        function handler(value) {
            if (typeof value === "string") {
                return unzip(value,false);
            }
            return value;
        }

        return arr.map((geometry) => {
            if (geometry.data) {
                const data = geometry.data;
                if (data.attributes) {
                    for (let key in data.attributes) {
                        data.attributes[key].array = handler(data.attributes[key].array);
                    }
                }
                if (data.index) {
                    data.index.array = handler(data.index.array);
                }
            }
            return geometry;
        })
    }

    public async unpack(file: Blob) {
        const zip = new JSZip();
        let editorJson;
        let drawingInfo = {
            imgSrc: "",
            markList: [],
            imgInfo: {}
        }
        // 贴图map
        let textureMap = new Map<string, string | object>();
        // 几何数据数组
        let geometries: Array<any> = [];

        const res = await zip.loadAsync(file);
        /**
         * res.files里包含整个zip里的文件描述、目录描述列表
         * res本身就是JSZip的实例
         */
        for (let key in res.files) {
            //判断是否是目录
            if (!res.files[key].dir) {
                //找到我们压缩包所需要的json文件
                if (res.files[key].name === "scene.json") {
                    const content = await res.file(res.files[key].name)?.async('string') as string;
                    //得到scene.json文件的内容
                    editorJson = JSON.parse(content);
                } else if (res.files[key].name.substring(0, 9) === "Textures/") {
                    /**
                     * 贴图
                     * 分为两种情况：
                     * 1.贴图为env格式（type!width!height!uuid.env），转换为arraybuffer格式，存入map
                     * 2.贴图为普通图片格式，直接存入map
                     **/
                    if (/\.env$/.test(res.files[key].name)) {
                        // 转换回贴图原始信息，存入map
                        const content = await res.file(res.files[key].name)?.async('arraybuffer') as ArrayBuffer;
                        const filedArr = res.files[key].name.replace("Textures/", "").split("!");
                        textureMap.set(filedArr[3], content);
                    } else {
                        const content = await res.file(res.files[key].name)?.async('string') as string;
                        textureMap.set(res.files[key].name.replace("Textures/", ""), content);
                    }
                } else if (/^Geometries\/geometries_\d*\.zip$/.test(res.files[key].name)) {
                    // geometry切片zip包，内部是json文件
                    const content = await res.file(res.files[key].name)?.async('blob') as Blob;
                    const zip = new JSZip();
                    const zipRes = await zip.loadAsync(content);
                    for (let zipKey in zipRes.files) {
                        const content = await zip.file(zipRes.files[zipKey].name)?.async('string') as string;
                        geometries.push(...this.unGzipGeometryJson(JSON.parse(content)));
                    }
                } else if (res.files[key].name.substring(0, 8) === "Drawing/") {
                    /**
                     * 图纸文件夹下的文件
                     * 1. drawingMarking.txt 为图纸标注文件，须解压
                     * 2. sceneId开头的图片是图纸
                     */
                    if (res.files[key].name === "Drawing/drawingMark.txt") {
                        const content = await res.file(res.files[key].name)?.async('string') as string;
                        drawingInfo.markList = unzip(content)
                    } else if(res.files[key].name === "Drawing/drawingImgInfo.json"){
                        drawingInfo.imgInfo = JSON.parse(await res.file(res.files[key].name)?.async('string') as string);
                    } else {
                        drawingInfo.imgSrc = await res.file(res.files[key].name)?.async('string') as string;
                    }
                }
            }
        }

        // 贴图还原至sceneJson
        editorJson.scene.images = editorJson.scene.images.map((item) => {
            const nameSplit = item.split(".");
            if (nameSplit[1] === "env") {
                const urlSplit = nameSplit[0].split("!");
                return {
                    uuid: urlSplit[3],
                    url: {
                        type: urlSplit[0],
                        width: parseInt(urlSplit[1]),
                        height: parseInt(urlSplit[2]),
                        /**
                         * sceneJson打zip包前原数据为Array,此处解压后我们使用ArrayBuffer，不还原为Array
                         * 还原为Array这样写 Array.from(new TYPED_ARRAYS[urlSplit[0]](textureMap.get(urlSplit[3] + ".env")))
                         **/
                        data: textureMap.get(urlSplit[3] + ".env") //
                    }
                }
            } else {
                return {
                    uuid: nameSplit[0],
                    url: textureMap.get(item)
                }
            }
        })

        textureMap.clear();

        // 几何数据还原至sceneJson
        editorJson.scene.geometries = geometries;

        // 图纸信息还原至sceneJson
        if (drawingInfo.imgSrc !== "") editorJson.drawingInfo = drawingInfo;

        return editorJson;
    }
}