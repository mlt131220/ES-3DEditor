import { createRouter,createWebHashHistory} from "vue-router"
import HelloWorldVue from "../components/HelloWorld.vue"

const routes = [
    {
        path:"/",
        component:HelloWorldVue
    },
]

export default createRouter({
    history:createWebHashHistory(),
    routes
})
