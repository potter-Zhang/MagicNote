import request from "@/util/request";

export const logAPI = (userid) => {
    return request.get("/log/getall/" + userid);
}