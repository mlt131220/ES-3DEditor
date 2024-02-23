/**
 * @date 2023/01/10
 * @author 二三
 * @description 网络请求worker
 */
import {XMLHttp} from "./XHQ.js";

self.onmessage = function (event) {
    console.log("RequestWorker",event.data)
    let data = event.data;
    let _modelData = data.data;
    let dataLength = _modelData.length;
    let i = 0;
    function addModel(){
        if ( i === dataLength ){
            i=0;
            return;
        }
        // if(JSON.stringify(_modelData[i]).length / 1024 / 1024 > 10){
        //     console.log("zip压缩：",_modelData[i])
        //     console.log(data.url," zip压缩后仍然超过10M：",_modelData[i].length / 1024 / 1024)
        // }

        XMLHttp.sendReq("POST", data.url, _modelData[i], (response) => {
            i = i + 1;
            self.postMessage({
                operation: "success",
                type: data.type,
                response
            })
            addModel(_modelData[i]);
        }, (response) => {
            self.postMessage({
                operation: "error",
                type: data.type,
                message: response.message
            })
        })
    }
    switch (data.type) {
        case "scene": //保存场景
            XMLHttp.sendReq("POST", data.url, data.data, (response) => {
                self.postMessage({
                    operation: "success",
                    type: data.type,
                    response
                })
            }, (response) => {
                self.postMessage({
                    operation: "error",
                    type: data.type,
                    message: response.message
                })
            })
            break;
        case "images": //保存贴图
        case "geometry": //保存几何数据
        case "models": //保存模型
            addModel();
            break;
    }
};
