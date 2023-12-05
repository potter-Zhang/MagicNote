/* eslint-disable */
import request from "@/util/request";
import axios from 'axios'

const baseURL = 'http://localhost:8081'

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

export var streamAnswerAPI = (text) => {
    return new streamAPI().post(baseURL + '/ai/answer', text)
}

export const streamInitAPI = (text) => {
    return new streamAPI().post(baseURL + '/ai/init', text)
}

export class streamAPI {
    xhr;
    data;
    dataHandler = (res) => {}
    endHandler = (res) => {}
    errorHandler = (err) => {}

    constructor() {
        this.xhr = new XMLHttpRequest()
        return this
    }
    post(url, AIObj) {
        this.xhr.open('POST', url, true)
        this.xhr.setRequestHeader('Content-Type', 'text/event-stream')
        this.data = "num=" + AIObj.num + "&str=" + AIObj.str
        return this
    }
    withDataHandler(handler) {
        this.dataHandler = handler
        return this
    }
    withErrorHandler(handler) {
        this.errorHandler = handler
        return this
    }
    withEndHandler(handler) {
        this.endHandler = handler
        return this
    }
    send() {
        this.xhr.onreadystatechange = () => {
            if (this.xhr.readyState === 3) {
                this.dataHandler(this.xhr.responseText)
              }
            if (this.xhr.readyState === 4) {
              if (this.xhr.status === 200) {
                this.dataHandler(this.xhr.responseText)
              }
              else {
                this.errorHandler(this.xhr.responseText)
              }
                this.endHandler(this.xhr.responseText)
              }
            }
        this.xhr.send(this.data)
    }

    
    


}

