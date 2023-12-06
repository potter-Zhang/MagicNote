<template>
<div id="bubble" class="bubble-container">
    <div class="ai-header">
        <label class="ai-function">{{ funcName }}</label>
        <div style="display: flex;">
          <el-button class="ai-btn" @click="insert">插入</el-button>
          <el-button class="ai-btn" @click="replace">替换</el-button>
          <el-button class="ai-btn" @click="close">关闭</el-button>
        </div>
    </div>
    <div class="ai-text" >
        <textarea class="ai-text-area" id="ai-text-area" v-model="processedText"></textarea>
    </div>
    <div id="tail"></div>
    <div id="tail-shadow"></div>
</div>
</template>

<script setup>
import {ref, defineProps, watch, onMounted, onBeforeUnmount} from 'vue'
import { streamGenerateTableAPI, streamGetAbstractAPI, streamGetExpandAPI, streamGetSegmentAPI, streamGenerateFlowChartAPI } from '@/api/ai';
import {globalEventBus} from "@/util/eventBus";

const loading = ref(true)

const props = defineProps({
    text: { type: String, default: ''},
    func: { type: String, required: true, default: ''},
})

const processedText = ref("");

const emit = defineEmits(['close', 'insert', 'replace', 'functionDone'])

onMounted(() => {
  // ai对话窗口打开时关闭AIBubble
  globalEventBus.on("DialogPanelOpen", () => {
    emit("close");
  })
})

onBeforeUnmount(() => {
  globalEventBus.off("DialogPanelOpen");
})

function close() {
    processedText.value = ''
    emit('close')
}

function insert() {
    console.log('insert')
    emit('insert', processedText.value)
}

function replace() {
    emit('replace', processedText.value)
}

const funcName = ref("");

const translate = (name) => {
  switch (name) {
    case 'abstract': return "缩写";
    case 'expand': return "扩写";
    case 'segment': return "分段";
    case 'generateTable': return "生成表格";
    case 'generateFlowChart': return "流程图";
    default: return "ai";
  }
}

watch(() => props.func, () => {
  // api调用完毕后发送functionDone事件，父组件清空props.func属性
  // 当props.func属性不为空时调用api
  if (props.func === "")
    return;
  loading.value = true;
  // 使用funcName存储函数名，避免props.func被清空时标题消失
  funcName.value = translate(props.func);
  processedText.value = AIFunctions.value[props.func](props.text);
})

function errorHandler(err) {
    console.log(err)
    processedText.value = err.response.data.error
}

function setTextBuffer(msg) {
    loading.value = false
    processedText.value = msg;
    const container = document.getElementById("ai-text-area")
    container.scrollTop = container.scrollHeight;
}


function abstract (text) {
    var data = {
        str: text,
        num: 0
    }
    console.log(data)
    streamGetAbstractAPI(data)
        .withDataHandler((msg) => { setTextBuffer(msg) })
        .withErrorHandler((err) => { errorHandler(err) })
        .withEndHandler(() => emit("functionDone"))
        .send()
}

function expand (text) {
    var data = {
        str: text,
        num: 0
    }
    streamGetExpandAPI(data)
        .withDataHandler((msg) => { setTextBuffer(msg) })
        .withErrorHandler((err) => { errorHandler(err) })
        .withEndHandler(() => emit("functionDone"))
        .send()
}


function segment (text) {
    var data = {
        str: text,
        num: 0
    }
    streamGetSegmentAPI(data)
        .withDataHandler((msg) => { setTextBuffer(msg) })
        .withErrorHandler((err) => { errorHandler(err) })
        .withEndHandler(() => emit("functionDone"))
        .send()
}

async function generateTable (text) {
    var data = {
        str: text,
        num: 0
    }
    streamGenerateTableAPI(data)
        .withDataHandler((msg) => { setTextBuffer(msg) })
        .withErrorHandler((err) => { errorHandler(err) })
        .withEndHandler(() => emit("functionDone"))
        .send()
}

async function generateFlowChart (text) {
    var data = {
        str: text,
        num: 0
    }
    streamGenerateFlowChartAPI(data)
        .withDataHandler((msg) => { setTextBuffer(msg) })
        .withErrorHandler((err) => { errorHandler(err) })
        .withEndHandler(() => emit("functionDone"))
        .send()
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
    transform: translate(-95%, -105%);
    z-index: 15;
    width: 50%;
    max-width: 400px;
    height: 40%;
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-items: center;
    border-radius: 10px 10px 0 0;
    box-shadow: 2px 2px 3px 3px rgb(200,200,200, 0.5);
}

.ai-text {
    position: relative;
    padding: 5px;
    box-sizing: border-box;
    max-height: 500px;
    height: 100%;
    width: 100%;
    background-color: white;
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
    border: 0;
    outline: none;
}


.ai-text-area::-webkit-scrollbar {
    display: none;
}

.ai-header {
    padding: 0.5em;
    width: 100%;
    box-sizing: border-box;
    background-color: #a5d63f;
    box-shadow: 0 2px 1px rgb(200,200,200);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 10px 10px 0 0;
}

.ai-function {
    float: left;
    margin-left: 2%;
    font-size: medium;
    color: white;
    font-weight: bold;
}

.ai-btn {
    background-color: white;
    margin-right: 3%;
    width: 8%;
    height: 100%;
    border-radius: 5px;
    min-width: 50px;
}
.ai-btn:hover {
  background-color: rgb(245,245,245);
}
.ai-btn, .ai-btn:focus:not(.ai-btn:hover){
  /*点击后自动失焦*/
  color: var(--el-button-text-color);
  background-color: var(--el-button-bg-color);
  border-color: var(--el-button-border-color);
}

#tail {
  position: absolute;
  top: 99.5%;
  left: 100%;
  transform: translate(-100%, 0);
  height: 0;
  width: 0;
  border-top: 10px solid white;
  border-left: 30px solid transparent;
  border-right: 5px solid transparent;
}
#tail-shadow {
  position: absolute;
  top: 100%;
  left: 100%;
  z-index: -1;
  transform: translate(-90%, 0);
  height: 0;
  width: 0;
  border-top: 16px solid rgb(200,200,200,0.6);
  border-left: 40px solid transparent;
  border-right: 10px solid transparent;
  filter: blur(2px);
}
</style>