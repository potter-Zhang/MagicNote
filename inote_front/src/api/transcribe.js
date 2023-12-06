
import request from "@/util/request";

export const transformAudioVideoAPI = (file) => {
    return request.post("/transcribe", file);
}
