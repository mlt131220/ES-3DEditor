import { InjectionKey } from 'vue';
import { createStore, createLogger, useStore as baseUseStore, Store } from "vuex";
import State from './state';
import Mutations from './mutations'
import { RootState } from "../type/store";

const debug = process.env.NODE_ENV !== 'production'

// 定义 injection key
export const key: InjectionKey<Store<RootState>> = Symbol()

export const store = createStore<RootState>({
    state:State,
    mutations:Mutations,
    strict: debug, //严格模式
    plugins: debug ? [createLogger()] : []
})

// 定义自己的 `useStore` 组合式函数
export function useStore() {
    return baseUseStore(key)
}