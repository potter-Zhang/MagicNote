<template>
<div class="bubble-container">
    <!--
    <div class="ai-text" v-if="showTextArea && props.flip">
        <textarea class="ai-text-area" v-model="text"></textarea>
    </div>
    <div class="ai-buttons">
        <button class="ai-button" v-for="(btn, id) in buttons" :key="id" @click="wrapper(btn.func)">{{ btn.label }}</button>
    </div>
-->
    <div class="ai-header">
        <label class="ai-function">{{ props.func }}</label>
        <button class="ai-btn" @click="close">关闭</button>
        <button class="ai-btn" @click="insert">插入</button>
        <button class="ai-btn" @click="replace">替换</button>
        
    </div>
    <div class="ai-text" v-loading="loading">
        
        <textarea class="ai-text-area" v-model="processedText"></textarea> 
        
    </div>
</div>

</template>

<script setup>
/* eslint-disable */
import { computed } from '@vue/reactivity';
import { ref, defineProps } from 'vue'
import { generateTableAPI, getAbstractAPI, getExpandAPI, getSegmentAPI, generateFlowChartAPI } from '@/api/ai';
import { ElLoading } from 'element-plus';


const textBuffer = ref('')

const loading = ref(true)

const callFlag = ref(false)

const props = defineProps({
    text: { type: String, default: ''},
    x: { type: Number, required: true, default: 100},
    y: { type: Number, required: true, default: 100},
    width: { type: Number, required: true, default: 100},
    height: { type: Number, required: true, default: 100},
    func: { type: String, required: true, default: ''}
})

const emit = defineEmits(['close', 'insert', 'replace'])

function close() {
    callFlag.value = false
    textBuffer.value = ''
    loading.value = false
    emit('close')
}

function insert() {
    console.log('insert')
    emit('insert', textBuffer.value)
}

function replace() {
    emit('replace', textBuffer.value)
}

const func = computed({
    get() {
        return props.func
    },
    set(value) {
        props.func = value
    }
})

const processedText = computed({
    get() {
        if (!callFlag.value) {
            callFlag.value = true
            
            loading.value = true
            AIFunctions.value[props.func](props.text)
        } 
        return textBuffer.value
    },
    set(value) {
        textBuffer.value = value
    }
})

const text = computed({
    get() {
        return props.text
    },
    set(value) {
        props.text = value
    }
})

const bubbleWidth = computed({
    get() {
        return props.width + 'px'
    }
})

const bubbleHeight = computed({
    get() {
        return props.height + 'px'
    }
})

const top = computed({
    get() {
        console.log(props.x)
        return props.x + 'px'
        
    }
})


const left = computed({
    get() {
        return props.y + 'px'
    }
})



function errorHandler(err) {
    console.log(err)
    loading.value = false
    textBuffer.value = err.response.data.error
}

function setTextBuffer(msg) {
    console.log("hhhhhhhhhhhhhhhh")
    //loadingInstance.close()
    loading.value = false
    textBuffer.value = msg
}


function abstract (text) {
    var data = {
        str: text,
        num: 0
    }
    console.log(data)
    getAbstractAPI(data)
        .then((msg) => { setTextBuffer(msg) })
        .catch((err) => { errorHandler(err) })
}

function expand (text) {
    var data = {
        str: text,
        num: 0
    }
    getExpandAPI(data)
        .then((msg) => { setTextBuffer(msg) })
        .catch((err) => { errorHandler(err) })
}


function segment (text) {
    var data = {
        str: text,
        num: 0
    }
    getSegmentAPI(data)
        .then((msg) => { setTextBuffer(msg) })
        .catch((err) => { errorHandler(err) })
}

async function generateTable (text) {
    var data = {
        str: text,
        num: 0
    }
    generateTableAPI(data)
        .then((msg) => { setTextBuffer(msg) })
        .catch((err) => { errorHandler(err) })
}

async function generateFlowChart (text) {
    var data = {
        str: text,
        num: 0
    }
    generateFlowChartAPI(data)
        .then((msg) => { setTextBuffer(msg) })
        .catch((err) => { errorHandler(err) })
}


const AIFunctions = ref({
    'abstract': abstract,
    'expand': expand,
    'segment': segment,
    'generateTable': generateTable,
    'generateFlowChart': generateFlowChart
})

</script>

<style scoped>

.bubble-container {
    position: absolute;
    bottom: 0;
    left: 50%;
    z-index: 15;
    width: 50%;
    height: 40%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 0.75em;
    box-shadow: 0.75em;
    background-color: var(--el-color-primary-light-3);
}

.ai-text {
    padding: 0.01em;
    border-radius: 0.75em;
    max-height: 500px;
    height: 80%;
    width: 100%;
}

.ai-text-area {
    position: relative;
    width: 98%; 
    height: 98%; 
    box-sizing: border-box;
    line-height: 20px;
    margin-top: 1%;
    margin-left: 1%;
    resize: none;
    font-size: medium;
    z-index: -1;
}

/* HTML: <div class="loader"></div> */
.loader {
    height: 30%;
    aspect-ratio: 1;
    display: grid;
    place-items: center;
}
.loader::before,
.loader::after {    
  content:"";
  grid-area: 1/1;
  --c:no-repeat radial-gradient(farthest-side,#25b09b 92%,#0000);
  background: 
    var(--c) 50%  0, 
    var(--c) 50%  100%, 
    var(--c) 100% 50%, 
    var(--c) 0    50%;
  background-size: 12px 12px;
  animation: l12 1s infinite;
}
.loader::before {
  margin: 4px;
  filter: hue-rotate(45deg);
  background-size: 8px 8px;
  animation-timing-function: linear
}

@keyframes l12 { 
  100%{transform: rotate(.5turn)}
}

.ai-text-area::-webkit-scrollbar {
    display: none;
}

.ai-header {
    padding: 0.01em;
    width: 100%;
}

.ai-loading-mask {
    width: 100%;
    height: 100%;
    background-color: var(--el-color-primary-light-3);
    display: flex;
    justify-content: center;
}

.ai-function {
    float: left;
    margin-left: 2%;
    font-size: medium;
    font-family: fantasy;
}

.ai-btn {
    background-color: var(--el-color-primary);
    float: right;
    margin-right: 3%;
    width: 8%;
    height: 100%;
    border-radius: 0.75em;
    border-color: rgb(216, 234, 250);
}

.ai-buttons {
    display: flex;
    flex-direction: row;
    justify-content: center;
    background-color: rgb(12, 155, 121);
    border-radius: 0.75em;
    width: 100%;
    height: 50px;
}

.ai-button {
    background-color: rgb(12, 192, 63);
    border-radius: 0.75em;
    padding: 0.75em;
    box-shadow: 5px;
}
</style>