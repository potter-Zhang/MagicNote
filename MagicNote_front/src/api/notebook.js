import request from "@/util/request";

export const addNotebookAPI = (data) => {
    return request.post("/notebook/add", data);
}

export const delNotebookByIdAPI = (id) => {
    return request.delete("/notebook/delete1/" + id);
}

export const updateNotebookAPI = (data) => {
    return request.put("/notebook/update", data);
}

export const getNotebooksAPI = (userid) => {
    return request.get("/notebook/getByUser/" + userid);
}