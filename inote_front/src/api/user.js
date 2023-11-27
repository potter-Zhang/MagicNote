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

export const updateUsernameAPI = (data) => {
    const params = new URLSearchParams();
    for (var key in data) {
        params.append(key, data[key]);
    }
    return request.put('/user/updateName', params);
}

export const updateProfileAPI = (data) => {
    const params = new URLSearchParams();
    for (var key in data) {
        params.append(key, data[key]);
    }
    return request.put('/user/updateProfile', params);
}