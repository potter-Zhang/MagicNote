
import request from "@/util/request";

export const transformPdfAPI = (file) => {
    return request.post("/ocr/pdf", file);
}

export const transformPptAPI = (file) => {
    return request.post("/ocr/ppt", file)
}
