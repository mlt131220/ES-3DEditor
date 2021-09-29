import { createRouter, createWebHashHistory } from "vue-router"

const routes = [
    {
        path: "/",
        component: () => import("../components/Layout.vue")
    },
]

export default createRouter({
    history: createWebHashHistory(),
    routes
})
