import axios from "axios";

const baseURL = "http://localhost:8080";
const instance = axios.create({baseURL});

instance.interceptors.response.use(
    result => {
        return result.data;
    },
    error => {
        alert("服务异常！");
        return Promise.reject(error); // 异步状态转变为失败状态
    }
)

export default instance;