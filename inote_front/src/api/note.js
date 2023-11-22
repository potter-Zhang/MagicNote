import request from "@/util/request";

export const getAllNotesAPI = (data) => {
    return request.get("/note/getall", data);
}

export const getNoteAPI = (data) => {
    return request.get("/note/get", data);
}

export const addNoteAPI = (data) => {
    return request.post("/note/add", data);
}

export const delNoteAPI = (data) => {
    return request.delete("/note/delete", data);
}

export const updateNoteAPI = (data) => {
    return request.put("/note/update", data);
}