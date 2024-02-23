import axios from 'axios';
import type {AxiosError, AxiosInstance, AxiosRequestConfig} from 'axios';
import {
    handleAxiosError,
    handleBackendError,
    handleResponseError,
    handleServiceResult,
} from '@/utils/service';
import {Service} from "../../../types/network";
import ConcurrencyManager from "./ConcurrencyManager";

/**
 * 封装axios请求类
 * @author Soybean<honghuangdc@gmail.com>
 */
const MAX_CONCURRENT_REQUESTS = 6;
export default class CustomAxiosInstance {
    instance: AxiosInstance;
    backendConfig: Service.BackendResultConfig;
    manager: any;

    /**
     *
     * @param axiosConfig - axios配置
     * @param backendConfig - 后端返回的数据配置
     */
    constructor(
        axiosConfig: AxiosRequestConfig,
        backendConfig: Service.BackendResultConfig = {
            codeKey: 'code',
            dataKey: 'result',
            msgKey: 'message',
            successCode: 200
        }
    ) {
        this.backendConfig = backendConfig;
        this.instance = axios.create(axiosConfig);
        this.manager = ConcurrencyManager(this.instance, MAX_CONCURRENT_REQUESTS);
        this.setInterceptor();
    }

    /** 设置请求拦截器 */
    setInterceptor() {
        this.instance.interceptors.request.use(
            async config => {
                const handleConfig = {...config};
                if (handleConfig.headers) {
                }
                return handleConfig;
            },
            (axiosError: AxiosError) => {
                const error = handleAxiosError(axiosError);
                return handleServiceResult(error, null);
            }
        );
        this.instance.interceptors.response.use(
            async response => {
                const {status} = response;
                if (status === 200 || status < 300 || status === 304) {
                    const backend = response.data;
                    // 判断返回文件流的情况
                    if (response.headers['content-type'].includes('application/octet-stream')) {
                        return handleServiceResult(null, backend);
                    }
                    const {codeKey, dataKey, successCode} = this.backendConfig;
                    // 请求成功
                    if (backend[codeKey] === successCode) {
                        const keyArr = Object.values(this.backendConfig);
                        const other = {};
                        Object.keys(backend).forEach(item => {
                            if (!keyArr.includes(item)) {
                                other[item] = backend[item];
                            }
                        });
                        return handleServiceResult(null, backend[dataKey], other);
                    }

                    const error = handleBackendError(backend, this.backendConfig);
                    return handleServiceResult(error, null);
                }
                const error = handleResponseError(response);
                return handleServiceResult(error, null);
            },
            (axiosError: AxiosError) => {
                const error = handleAxiosError(axiosError);
                return handleServiceResult(error, null);
            }
        );
    }
}
