export function dateTimeFormat(fmt) {
    let myDate = new Date();
    let o = {
        "M+": myDate.getMonth() + 1, //月份
        "d+": myDate.getDate(), //日
        "H+": myDate.getHours(), //小时
        "m+": myDate.getMinutes(), //分
        "s+": myDate.getSeconds(), //秒
        "q+": Math.floor((myDate.getMonth() + 3) / 3), //季度
        "S": myDate.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (myDate.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (let k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}