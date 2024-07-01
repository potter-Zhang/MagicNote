/*
*
* vue-router用于进行vue文件的导航，直接使用a标签无法导航到指定的vue文件
* 在vue中使用<router-link>标签来进行导航
*
* */

import {createRouter, createWebHistory} from "vue-router";

import LoginVue from '@/views/LoginView.vue'
import MainPageVue from '@/views/MainPage.vue'
import UserInfoVue from "@/views/UserInfo.vue"
import TestVue from "@/views/test.vue"
import EditVue from "@/components/Edit/index.vue"

const routes = [
    {path: "/", component: LoginVue},
    {path: "/dashboard", component: MainPageVue},
    {path: "/userInfo", component: UserInfoVue},
    {path: "/test", component: TestVue},
    {path: "/edit", component: EditVue}
]

const router = createRouter({
    history: createWebHistory(),
    routes: routes
});

export default router
