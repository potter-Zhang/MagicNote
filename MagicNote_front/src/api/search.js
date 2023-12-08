import request from "@/util/request";

export const searchAPI = (data) => {
    const params = new URLSearchParams();
    for (var key in data) {
        params.append(key, data[key]);
    }
    return request.get("/search", {params: params});
}