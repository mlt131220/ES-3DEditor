/**
 * @date 2023/01/10
 * @author 二三
 * @description XMLHttpRequest池，减少new XMLHttpRequest();
 */
export const XMLHttp = {
    _objPool: [],
    _getInstance: function () {
        for (let i = 0; i < this._objPool.length; i++) {
            if (this._objPool[i].readyState === 0 || this._objPool[i].readyState === 4) {
                return this._objPool[i];
            }
        }
        this._objPool.push(new XMLHttpRequest());
        return this._objPool[this._objPool.length - 1];
    },
    // 发送请求(方法[post,get], 地址, 数据, 成功回调函数，失败回调函数)
    sendReq: function (method, url, data, successFn, errorFn = () => {
    }) {
        let objXMLHttp = this._getInstance();
        try {
            url = '/editor_server' + url;
            // 加随机数防止缓存
            if (url.indexOf("?") > 0) {
                url += "&random=" + Math.random();
            } else {
                url += "?random=" + Math.random();
            }
            objXMLHttp.open(method, url, true);
            objXMLHttp.responseType = 'json';
            objXMLHttp.setRequestHeader("Content-Type", "application/json");
            // objXMLHttp.setRequestHeader("Authorization", "");
            objXMLHttp.send(JSON.stringify(data));
            objXMLHttp.onload = function () {
                if ((objXMLHttp.status >= 200 && objXMLHttp.status < 300) || objXMLHttp.status === 304) {
                    successFn(objXMLHttp.response);
                } else {
                    errorFn(objXMLHttp.response)
                }
            }
        } catch (e) {
            alert(e);
        }
    }
};
