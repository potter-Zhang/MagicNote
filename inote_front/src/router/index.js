/*
*
* vue-router用于进行vue文件的导航，直接使用a标签无法导航到指定的vue文件
* 在vue中使用<router-link>标签来进行导航
*
* */

import {createRouter, createWebHistory} from "vue-router";

import LoginVue from '@/views/Login.vue'
import MainPageVue from '@/views/MainPage.vue'

const routes = [
    {path: "/login", component: LoginVue},
    {path: "/", component: MainPageVue}
]

const router = createRouter({
    history: createWebHistory(),
    routes: routes
});

export default router
