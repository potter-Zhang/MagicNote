import request from "@/util/request";

// 掉用注册接口的函数
export const userRegisterService = (registerData) =>{
    const params = new URLSearchParams();
    for (let key in registerData) {
        params.append(key, registerData[key]);
    }
    return request.post('/user/register', registerData);
}