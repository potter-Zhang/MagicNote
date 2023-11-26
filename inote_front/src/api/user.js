import request from "@/util/request";

// 调用注册接口的函数
export const registerAPI = (registerData) =>{
    return request.post('/register', registerData);
}

export const registerByEmailAPI = (registerData) => {
    return request.post('/registerByEmail', registerData);
}

//  调用登录接口的函数
export const loginAPI = (loginData) => {
    return request.post('/login', loginData);
}

export const loginByEmailAPI = (loginData) => {
    return request.post('/loginByEmail', loginData);
}

export const updateUserAPI = (data) => {
    return request.put('/user/update', data);
}