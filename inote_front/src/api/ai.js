/* eslint-disable */
import request from "@/util/request";
import axios from 'axios'

const baseURL = 'http://localhost:8081'

export const getAbstractAPI = (text) => {
    return request.post("/ai/abstract", text);
}

export const streamGetAbstractAPI = () => {
    return new streamAPI().post(baseURL + "/ai/abstract")
}

export const getExpandAPI = (text) => {
    return request.post("/ai/expand", text);
}

export const streamGetExpandAPI = () => {
    return new streamAPI().post(baseURL + "/ai/expand")
}

export const getSegmentAPI = (text) => {
    return request.post('/ai/segment', text)
}

export const streamGetSegmentAPI = () => {
    return new streamAPI().post(baseURL + "/ai/segment")
}

export const generateTableAPI = (text) => {
    return request.post('/ai/generateTable', text)
}

export const streamGenerateTableAPI = () => {
    return new streamAPI().post(baseURL + "/ai/generateTable")
}

export const generateFlowChartAPI = (text) => {
    return request.post('/ai/generateFlowChart', text)
}

export const streamGenerateFlowChartAPI = () => {
    return new streamAPI().post(baseURL + "/ai/generateFlowChart")
}

export const initAPI = (text) => {
    return request.post('/ai/init', text)
}

export const answerAPI = (text) => {
    return request.post('/ai/answer', text)
}

export var streamAnswerAPI = () => {
    return new streamAPI().post(baseURL + '/ai/answer')
}


export class streamAPI {
    xhr;
    data;
    dataHandler = (res) => {}
    endHandler = (res) => {}
    errorHandler = () => {}

    constructor() {
        this.xhr = new XMLHttpRequest()
        return this
    }
    post(url) {
        this.xhr.open('POST', url)
        //this.xhr.setRequestHeader('Content-Type', 'text/event-stream')
        this.xhr.setRequestHeader ('Content-type', 'application/json');  //设置为表单方式提交
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
    send(AIObj) {
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
                this.endHandler()
              }
            }

        this.xhr.send(JSON.stringify(AIObj))
    }

    
    


}
