import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { store, key } from './store'
import * as THREE from 'three'

const app = createApp(App).use(router);

// 传入 injection key
app.use(store, key)

app.config.globalProperties.$three = THREE;

app.mount('#app');