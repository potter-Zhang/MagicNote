import request from "@/util/request";

export const getAllNotesAPI = (notebookId) => {
    return request.get("/note/getByNotebook/" + notebookId);
}

export const getNoteAPI = (noteId) => {
    return request.get("/note/get1/" + noteId);
}

export const addNoteAPI = (data) => {
    return request.post("/note/add", data);
}

export const delNoteByIdAPI = (id) => {
    return request.delete("/note/delete1/" + id);
}

export const updateNoteAPI = (data) => {
    return request.put("/note/update", data);
}

export const updateNoteNameAPI = (data) => {
    return request.put("/note/updateName", data);
}