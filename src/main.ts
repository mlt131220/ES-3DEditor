import { createApp } from 'vue';
import App from './App.vue';
import { setupStore } from '@/store';

import 'uno.css';
import "animate.css/animate.min.css";
import '@/assets/less/index.less';

import {setupI18n} from '@/language';
import {setupRouter} from "@/router";

async function main() {
    const app = createApp(App);

    setupRouter(app);

    // 配置存储
    setupStore(app);

    // 多语言配置
    setupI18n(app);

    app.mount('#app');
}

main();




