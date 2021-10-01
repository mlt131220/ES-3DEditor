import { createRouter, createWebHashHistory } from "vue-router"

const routes = [
    {
        path: "/",
        component: () => import("../views/Layout.vue")
    },
]

export default createRouter({
    history: createWebHashHistory(),
    routes
})
