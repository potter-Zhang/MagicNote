import request from "@/util/request";

export const addNotebookAPI = (data) => {
    return request.post("/notebook/add", data);
}

export const delNotebookAPI = (data) => {
    return request.delete("/notebook/delete", data);
}

export const updateNotebookAPI = (data) => {
    return request.put("/notebook/update", data);
}

export const getNotebooksAPI = (userid) => {
    return request.get("/notebook/getByUser/" + userid);
}