import {request} from "@/http/request";

/**
 * 上传
 * @change 2023/08/29 改为上传到upyun
 */
export function fetchUpload(data) {
    return request.post<string>(`/sys/upyun/upload`,data,{headers:{"Content-Type":"multipart/form-data"}});
}