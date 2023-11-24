import axios from "axios";
import {currentUser} from "@/global";
import config from "@icon-park/vue-next/lib/icons/Config";

const baseURL = "http://localhost:8081";
const instance = axios.create({baseURL});

instance.interceptors.response.use(
    result => {
        return result.data;
    },
    error => {
        // alert("服务异常！");
        // console.log(error);
        return Promise.reject(error); // 异步状态转变为失败状态
    }
)

instance.interceptors.request.use(
    config => {
        //  如果有令牌则配置令牌
        if (currentUser.value.token.length > 0 && config.headers.Authorization === undefined) {
            config.headers.Authorization = 'Bearer ' + currentUser.value.token;
        }
        // console.log(config);
        return config;
    }
)

export default instance;