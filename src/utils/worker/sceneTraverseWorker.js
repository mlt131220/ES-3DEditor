/**
 * @date 2023/01/10
 * @author 二三
 * @description 遍历场景的worker
 */
let sceneId = "";
let sceneTraverseModels = []; //scene下遍历出来的所有层级的模型
let sceneTraverseModelsImages = []; //scene下遍历出来的所有的模型贴图
let sceneTraverseModelsGeometries = []; //scene下遍历出来的所有的几何数据

self.onmessage = function (event) {
    let data = event.data;
    sceneId = data.sceneId;

    getSceneAndModelsJson(data.sceneJson);
};

const TYPED_ARRAYS = {
    Int8Array: Int8Array,
    Uint8Array: Uint8Array,
    Uint8ClampedArray: Uint8ClampedArray,
    Int16Array: Int16Array,
    Uint16Array: Uint16Array,
    Int32Array: Int32Array,
    Uint32Array: Uint32Array,
    Float32Array: Float32Array,
    Float64Array: Float64Array
};

function _arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return self.btoa(binary);
}

/**
 * 遍历场景数据
 * @param {*} object 当前对象
 * @param {*} parentObj  父级对象
 * @param {number} layer 层级
 */
const getSceneTraverseModelsAll = (object, parentObj, layer) => {
    if(object.userData === undefined) object.userData = {};

    //scene下层级每次遍历layer + 1
    object.userData.layer = layer;

    //判断obj是否有children
    if (object.children) {
        //for循环提高性能
        for (let i = 0; i < object.children.length; i++) {
            getSceneTraverseModelsAll(object.children[i], object, layer + 1);
            object.children[i] = {
                "uuid": object.children[i].uuid
            };
        }
    }

    //单个模型数据大于10 M的打印一下
    // const objString = JSON.stringify(object);
    // if (objString.length / (1024 * 1024) > 10) {
    //     console.log("模型数据：", object, "模型JSON数据大小：", (objString.length) / (1024 * 1024) + "MB")
    // }

    sceneTraverseModels.push({
        "uuid": object.uuid,
        "sceneId": sceneId,
        "model": object
    });
}

const getSceneAndModelsJson = (sceneJson) => {
    //遍历贴图的base64信息存至数据库
    if (sceneJson.images !== undefined) {
        sceneJson.images = sceneJson.images.map(item => {
            item.urlType = "base64";
            if(typeof item.url !== "string"){
                item.url.data = _arrayBufferToBase64(new TYPED_ARRAYS[item.url.type](item.url.data).buffer);
                item.urlType = item.url.type;
                item.url = JSON.stringify(item.url)
            }
            item.sceneId = sceneId;
            sceneTraverseModelsImages.push(item); //保存贴图
            return item.uuid;
        })
    }

    //遍历几何数据信息存至数据库
    if (sceneJson.geometries !== undefined) {
        sceneJson.geometries = sceneJson.geometries.map(item => {
            sceneTraverseModelsGeometries.push({
                "uuid": item.uuid,
                "sceneId": sceneId,
                "geometry": item
            });
            return item.uuid;
        })
    }

    //递归遍历sceneJson 子级
    if(sceneJson.object.userData === undefined) sceneJson.object.userData = {};
    sceneJson.object.userData.type = "Scene";
    sceneJson.object.children = sceneJson.object.children.map(obj => {
        if(obj.userData === undefined) obj.userData = {};

        if (obj.userData.type === undefined) {
            if (obj.type.indexOf("Light") !== -1) {
                obj.userData.type = "Light";
            }
        }

        getSceneTraverseModelsAll(obj, sceneJson.object, 1);
        return {
            "uuid": obj.uuid
        };
    })

    //记录该场景总模型数量
    sceneJson.modelTotal = sceneTraverseModels.length;

    setTimeout(() => {
        /* 为避免数据量过大超过V8引擎对于字符串2^32的限制，分为多次传输（100个模型传输一次） */
        //每100个模型传输一次，总传输次数
        const transferNum = Math.ceil(sceneTraverseModels.length / 100);
        for (let i = 0; i < transferNum; i++) {
            if(i === transferNum - 1){
                self.postMessage({
                    models: sceneTraverseModels.slice(i * 100,sceneTraverseModels.length),
                    status: "models",
                })
                self.postMessage({
                    images: sceneTraverseModelsImages,
                    status: "images",
                })
                self.postMessage({
                    geometries: sceneTraverseModelsGeometries,
                    status: "geometries",
                })
                self.postMessage({
                    sceneJson: sceneJson,
                    status: "scene",
                })
            }else{
                self.postMessage({
                    models: sceneTraverseModels.slice(i * 100,(i + 1) * 100),
                    status: "models",
                })
            }
        }

        //重置数据
        sceneTraverseModels = []; //scene下遍历出来的所有层级的模型
        sceneTraverseModelsImages = []; //scene下遍历出来的所有的模型贴图
        sceneTraverseModelsGeometries = {}; //scene下遍历出来的所有的几何数据
    }, 500)
}
