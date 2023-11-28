<script setup>
import CustomDialog from './CustomDialog.vue'
import arrowRight from "@icon-park/vue-next/lib/icons/ArrowRight";
import { ref, computed } from 'vue'

const isDragging = ref(false)
const left = ref(500)
const top = ref(300)
const userMsg = ref('')

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

function sendMessage (msg) {
  if (msg !== '') {
    messages.value.push({ role: 'user', content: msg })
    userMsg.value = "";
    const container = document.getElementById("chat-container")
    container.scrollTop = container.scrollHeight;
  }
}

const messages = ref([
  {
    role: 'assistant',
    content: '您好，请问有什么可以帮助您的吗？'
  },
  {
    role: 'user',
    content: 'go say bye-bye'
  },
  {
    role: 'user',
    content: 'awohefiahfiehfoiewhfaiwfewahfewahefwaheflhwaelfhwjefh'
  },
  {
    role: 'assistant',
    content: '长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本'
  }
])

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
    <div class="send-comp">
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
