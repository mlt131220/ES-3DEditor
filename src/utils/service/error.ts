import type { AxiosError, AxiosResponse } from 'axios';
import {
  DEFAULT_REQUEST_ERROR_CODE,
  DEFAULT_REQUEST_ERROR_MSG,
  ERROR_STATUS,
  NETWORK_ERROR_CODE,
  NETWORK_ERROR_MSG,
  REQUEST_TIMEOUT_CODE,
  REQUEST_TIMEOUT_MSG
} from '@/config/service';
import { showErrorMsg } from './msg';
import {Service} from "../../../types/network";

type ErrorStatus = keyof typeof ERROR_STATUS;

/**
 * 策略模式
 * @param actions 每一种可能执行的操作
 */
export function exeStrategyActions(actions: Common.StrategyAction[]) {
  actions.some(item => {
    const [flag, action] = item;
    if (flag) {
      action();
    }
    return flag;
  });
}

/**
 * 处理axios请求失败的错误
 * @param axiosError - 错误
 */
export function handleAxiosError(axiosError: AxiosError) {
  const error: Service.RequestError = {
    type: 'axios',
    code: DEFAULT_REQUEST_ERROR_CODE,
    msg: DEFAULT_REQUEST_ERROR_MSG
  };

  const actions: Common.StrategyAction[] = [
    [
      // 网路错误
      !window.navigator.onLine || axiosError.message === 'Network Error',
      () => {
        Object.assign(error, { code: NETWORK_ERROR_CODE, msg: NETWORK_ERROR_MSG });
      }
    ],
    [
      // 超时错误
      axiosError.code === REQUEST_TIMEOUT_CODE && axiosError.message.includes('timeout'),
      () => {
        Object.assign(error, { code: REQUEST_TIMEOUT_CODE, msg: REQUEST_TIMEOUT_MSG });
      }
    ],
    [
      // 请求不成功的错误
      Boolean(axiosError.response),
      () => {
        const errorCode: ErrorStatus = (axiosError.response?.status as ErrorStatus) || 'DEFAULT';
        // @ts-ignore
        const msg = axiosError.response?.data?.message || ERROR_STATUS[errorCode] || DEFAULT_REQUEST_ERROR_MSG;
        Object.assign(error, { code: errorCode, msg });
      }
    ]
  ];

  exeStrategyActions(actions);

  showErrorMsg(error);

  return error;
}

/**
 * 处理请求成功后的错误
 * @param response - 请求的响应
 */
export function handleResponseError(response: AxiosResponse) {
  const error: Service.RequestError = {
    type: 'axios',
    code: DEFAULT_REQUEST_ERROR_CODE,
    msg: DEFAULT_REQUEST_ERROR_MSG
  };

  if (!window.navigator.onLine) {
    // 网路错误
    Object.assign(error, { code: NETWORK_ERROR_CODE, msg: NETWORK_ERROR_MSG });
  } else {
    // 请求成功的状态码非200的错误
    const errorCode: ErrorStatus = response.status as ErrorStatus;
    const msg = response.data.message || ERROR_STATUS[errorCode] || DEFAULT_REQUEST_ERROR_MSG;
    Object.assign(error, { type: 'http', code: errorCode, msg });
  }

  showErrorMsg(error);

  return error;
}

/**
 * 处理后端返回的错误(业务错误)
 * @param backendResult - 后端接口的响应数据
 */
export function handleBackendError(backendResult: Record<string, any>, config: Service.BackendResultConfig) {
  const { codeKey, msgKey } = config;
  const error: Service.RequestError = {
    type: 'backend',
    code: backendResult[codeKey],
    msg: backendResult[msgKey]
  };

  showErrorMsg(error);

  return error;
}
