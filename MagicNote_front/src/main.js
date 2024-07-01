
import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router'
import ElementPlus from 'element-plus'
import "element-plus/dist/index.css"
import "@icon-park/vue-next/styles/index.css"
import "@/styles/element-variarbles.scss"
import "@/styles/iconpark.css"

const app = createApp(App);
app.use(router);
app.use(ElementPlus);
app.mount('#app');

document.documentElement.style.setProperty('--el-color-primary', '#3fa38b');
