import { InjectionKey } from 'vue'
import { createStore, createLogger, useStore as baseUseStore, Store } from "vuex"

const debug = process.env.NODE_ENV !== 'production'

// 为 store state 声明类型
export interface State {
    count: number
}

// 定义 injection key
export const key: InjectionKey<Store<State>> = Symbol()

export const store = createStore<State>({
    modules: {},
    strict: debug,
    plugins: debug ? [createLogger()] : []
})

// 定义自己的 `useStore` 组合式函数
export function useStore() {
    return baseUseStore(key)
}