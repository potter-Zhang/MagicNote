<script setup>
import CustomDialog from './CustomDialog.vue'
import arrowRight from "@icon-park/vue-next/lib/icons/ArrowRight";
import { ref, computed, watch, nextTick } from 'vue'
import { currentNote } from '../global';
import { initAPI, answerAPI, streamAnswerAPI, streamAPI } from '@/api/ai'
import { getNoteAPI } from '@/api/note'
import { Loading } from 'element-plus/es/components/loading/src/service';
import { ElMessage } from 'element-plus';
import axios from 'axios'

const isDragging = ref(false)
const left = ref(500)
const top = ref(300)
const userMsg = ref('')

var noteId = -1

const emit = defineEmits(['close'])

const thinking = ref(false)

const props = defineProps({
  visible: { type: Boolean, required: true, default: false }
})


const messages = ref([
  {
    role: 'assistant',
    content: '您好，请问有什么可以帮助您的吗？'
  }
])

function clearMessages() {
  messages.value = [{
    role: 'assistant',
    content: '您好，请问有什么可以帮助您的吗？'
  }]
}

const leftPx = computed({
  get () {
    return left.value + 'px'
  }
})

const topPx = computed({
  get () {
    return top.value + 'px'
  }
})

const dragStart = function () {
  isDragging.value = true
}

const dragEnd = function () {
  isDragging.value = false
}

function drag (event) {
  if (isDragging.value === true) {
    left.value = left.value + event.movementX
    top.value = top.value + event.movementY
    console.log(event.movementX)
  }
}

function addMessage(msgRole, msg) {
  if (msg !== '') {
    messages.value.push({ role: msgRole, content: msg })
    userMsg.value = "";
  }
}

async function sendMessage (msg) {
  if (msg !== '') {
    
    messages.value.push({ role: 'user', content: msg })
    messages.value.push({ role: 'assistant', content: '' })
   
    thinking.value = true
    userMsg.value = "";
    const AIObj = {
      str: msg
    }
    let stream = streamAnswerAPI(AIObj)
    console.log(stream)
    streamAnswerAPI(AIObj)
    .withDataHandler((data) => {
      messages.value[messages.value.length - 1].content = data
    })
    .withEndHandler(() => thinking.value = false)
    .send()

   
    // const xhr = new XMLHttpRequest();
    // xhr.open('GET', `http://localhost:8081/ai/answer?num=0&str=hi`);
    // xhr.setRequestHeader('Content-Type', 'text/event-stream');
    // xhr.onreadystatechange = () => {
    //   if (xhr.readyState === 3) {
    //       // 将数据添加到文本框中
    //       messages.value[messages.value.length - 1].content = xhr.responseText
    //     }
    //   if (xhr.readyState === 4) {
    //     if (xhr.status === 200) {
    //       messages.value[messages.value.length - 1].content = xhr.responseText
    //       }
    //       thinking.value = false
    //     }
    //   }

    // xhr.send("num=0&str=hi")
    
      
  //   answerAPI(data)
  //   .then((returnMsg) => {addMessage('assistant', returnMsg);})
  //   .catch((err) => {console.log(err)})
  //   .finally(() => thinking.value = false)
  // 
}
}

watch(() => currentNote.value.updateCode, (newCode) => {
  if (newCode === 2) {
    clearMessages()
    emit('close')
    noteId = -1
  }
})

watch(() => props.visible, (newValue) => {
  console.log(newValue)
  if (!props.visible)
    return
  if (noteId === currentNote.value.noteId) {
    // do nothing
  }
  else {
    noteId = currentNote.value.noteId
    currentNote.value.updateCode = 1
    clearMessages()
    getNoteAPI(noteId).then((msg) => { 
      const data = {
        str: msg.content,
        num: 0
      }
      
      initAPI(data).then().catch((err) => console.log(err))
    }).catch((err) => console.log(err))

  }
},
{
  immediate: true
})


watch(messages.value, () => {
  // 消息渲染出来后再将滚动条拉到最底
  nextTick(() => {
    const container = document.getElementById("chat-container")
    container.scrollTop = container.scrollHeight;
  })
});


</script>

<template>
  <div class="panel">
    <div class="panel-header"  @mousemove="drag" @mousedown="dragStart" @mouseup="dragEnd" @mouseleave="dragEnd">
      <h1 style="margin: 5px 0 5px 0">ai助手</h1>
    </div>
    <div class="chat-container" id="chat-container">
      <CustomDialog v-for="(message, idx) in messages"
          :key="idx"
          :role="message.role"
          :content="message.content"
          ></CustomDialog>
    </div>
    <div class="send-comp" v-loading="thinking">
      <input class="send-text" v-model="userMsg" @keyup.enter="sendMessage(userMsg)" />
      <button class="send-button" @click="sendMessage(userMsg)"><arrow-right theme="outline" size="24" fill="#ffffff"/></button>
    </div>
  </div>
</template>

<style scoped>

  .send-comp {
    height: 50px;
    margin-top: 3%;
    display: flex;
    flex-direction: row;
    width: 100%;
  }
  .send-button {
    cursor: pointer;
    font-size: medium;
    margin-left: 5px;
    width: 15%;
    background-color: var(--el-color-primary-light-3);
    border-radius: 0.75em;
    border: #333;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .send-text {
    font-size: medium;
    font-weight: 100;
    padding: 0.75em;
    width: 80%;
    border-radius: 0.75em;
    border: 1px solid rgb(200,200,200);
  }
  .send-text:focus {
    outline: none;
    border: 2px solid var(--el-color-primary);
  }

  .chat-container {
    overflow-y: scroll;
    height: 80%;
  }

  .chat-container::-webkit-scrollbar {
      display: none;
  }

  .panel {
    display: flex;
    flex-direction: column;
    width: 95%;
    height: 400px;
    border-radius: 0.75em;
    padding: 5px;
  }

  .panel-header {
      font-weight: 100;
      user-select: none;
  }
</style>
