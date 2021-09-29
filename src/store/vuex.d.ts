import { ComponentCustomProperties } from 'vue'
import { Store } from 'vuex'

declare module '@vue/runtime-core' {
    //声明自己的store state
    interface State {
        count:number
    }

    // 为 `this.$store` 提供类型声明
    interface ComponentCustomProperties {
        $store:Store<State>
    }
}
