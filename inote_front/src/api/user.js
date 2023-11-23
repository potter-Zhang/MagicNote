import request from "@/util/request";

// 调用注册接口的函数
export const registerAPI = (registerData) =>{
    const params = new URLSearchParams();
    for (let key in registerData) {
        params.append(key, registerData[key]);
    }
    return request.post('/register', params.toString());
}

//  调用登录接口的函数
export const loginAPI = (loginData) => {
    return request.post('/login', loginData);
}

export const loginByEmailAPI = (loginData) => {
    return request.post('/loginByEmail', loginData);
}