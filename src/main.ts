import { createApp } from 'vue';
import App from './App.vue';
import { setupStore } from '@/store';
import 'uno.css';

import {setupI18n} from '@/language';
import { naive } from './config/importNaiveUI';

async function main() {
    const app = createApp(App);

    app.use(naive)

    // 配置存储
    setupStore(app);

    // 多语言配置
    setupI18n(app);

    app.mount('#app');
}

main();




