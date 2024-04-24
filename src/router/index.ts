import type { App } from 'vue';
import {createRouter, createWebHashHistory} from 'vue-router';
import {routes} from "@/router/routes";

const router = createRouter({
    history: createWebHashHistory(),
    routes,
    // 是否应该禁止尾部斜杠。默认为假
    strict: true,
    scrollBehavior: () => ({left: 0, top: 0}),
});

export function setupRouter(app: App<Element>) {
    app.use(router);
}