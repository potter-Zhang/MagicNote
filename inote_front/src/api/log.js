import request from "@/util/request";

export const logAPI = (userid) => {
    const requestBody = {
        id: userid
    }
    return request.get("/recent", {data: requestBody});
}