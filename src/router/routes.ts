export const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/home/index.vue')
    },
    {
        path: '/editor/:id',
        name: 'Editor',
        component: () => import("@/views/editor/index.vue")
    },
    {
        path: '/preview/:id',
        name: 'Preview',
        component: () => import("@/views/preview/index.vue")
    }
];