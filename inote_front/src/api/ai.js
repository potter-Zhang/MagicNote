/* eslint-disable */
import request from "@/util/request";
import axios from 'axios'

export const getAbstractAPI = (text) => {
    return request.post("/ai/abstract", text);
}

export const getExpandAPI = (text) => {
    return request.post("/ai/expand", text);
}

export const getSegmentAPI = (text) => {
    return request.post('/ai/segment', text)
}

export const generateTableAPI = (text) => {
    return request.post('/ai/generateTable', text)
}

export const generateFlowChartAPI = (text) => {
    return request.post('/ai/generateFlowChart', text)
}

export const initAPI = (text) => {
    return request.post('/ai/init', text)
}

export const answerAPI = (text) => {
    return request.post('/ai/answer', text)
}

export const streamAnswerAPI = (text) => {
    return axios({
        method: 'get', 
        headers: {
            Accept: 'text/event-stream',
        },
        url: 'http://localhost:8081/ai/streamChatWithWeb', 
        responseType: 'stream',
        data: text
        })
}

