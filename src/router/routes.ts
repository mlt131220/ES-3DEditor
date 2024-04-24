import Layout from "@/views/layout.vue";
import Preview from "@/views/preview.vue";

export const routes = [
    {
        path: '/',
        name: 'Home',
        component: Layout
    },
    {
        path: '/preview/:id',
        name: 'Preview',
        component: Preview
    }
];