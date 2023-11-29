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
        <button class="ai-btn" @click="close"></button>
    </div>
    <div class="ai-text">
        <textarea class="ai-text-area" v-model="processedText"></textarea>
    </div>
</div>

</template>

<script setup>
/* eslint-disable */
import { computed } from '@vue/reactivity';
import { ref, defineProps } from 'vue'
import { generateTableAPI, getAbstractAPI, getExpandAPI, getSegmentAPI, generateFlowChartAPI } from '@/api/ai';

const showTextArea = ref(false)

const textBuffer = ref('')

const callFlag = ref(false)

const folddedHeight = 300

const containerHeight = ref(folddedHeight)

const props = defineProps({
    text: { type: String, default: ''},
    x: { type: Number, required: true, default: 100},
    y: { type: Number, required: true, default: 100},
    width: { type: Number, required: true, default: 100},
    height: { type: Number, required: true, default: 100},
    func: { type: String, required: true, default: ''}
})

const emit = defineEmits(['close'])

function close() {
    callFlag.value = false
    textBuffer.value = ''
    emit('close')
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
    textBuffer.value = err.response.data.error
}

function setTextBuffer(msg) {
    console.log(msg)
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
    top: v-bind(top);
    left: v-bind(left);
    z-index: 15;
    width: v-bind(bubbleWidth);
    height: v-bind(bubbleHeight);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 0.75em;
    background-color: aliceblue;
}

.ai-text {
    padding: 0.05em;
    border-radius: 0.75em;
    max-height: 500px;
    height: 80%;
    width: 100%;
}

.ai-text-area {
    position: relative;
    width: 95%; 
    height: 95%; 
    box-sizing: border-box;
    line-height: 20px;
    margin-top: 1%;
    resize: none;
    font-size: medium;
}

.ai-header {
    padding: 0.05em;
    width: 100%;
}

.ai-function {
    float: left;
    margin-left: 2%;
    font-size: medium;
    font-family: fantasy;
}

.ai-btn {
    background-color:azure;
    float: right;
    margin-right: 2%;
    width: 5%;
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