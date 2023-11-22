<script setup>
import CustomDialog from './CustomDialog.vue'
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
  }
}

const messages = ref([
  {
    role: 'assistant',
    content: 'hello, how can I assist you?'
  },
  {
    role: 'user',
    content: 'go say bye-bye'
  },
  {
    role: 'user',
    content: 'awohefiahfiehfoiewhfaiwfewahfewahefwaheflhwaelfhwjefh'
  }
])

</script>

<template>
  <div class="panel">
  <div class="panel-header"  @mousemove="drag" @mousedown="dragStart" @mouseup="dragEnd" @mouseleave="dragEnd">
    <h1>Chat</h1>
    </div>
    <div class="chat-container">
      <CustomDialog v-for="(message, idx) in messages"
          :key="idx"
          :role="message.role"
          :content="message.content"
          ></CustomDialog>
        </div>
      <div class="send-comp">
        <input class="send-text" v-model="userMsg">
        <button class="send-button" @click="sendMessage(userMsg)">Send</button>
      </div>
  </div>
</template>

<style>

.send-comp {
  position: absolute;
  bottom: 0;
  left: 10px;
  margin-bottom: 20px;
  height: 50px;
  margin-left: 0%;
  display: flex;
  flex-direction: row;
  width: 100%;
}
.send-button {
  font-size: medium;
  font-weight: 100;
  margin-left: 5px;
  width: 15%;
  background-color: aquamarine;
  border-radius: 0.75em;
  border: #333;
}
.send-text {
  font-size: medium;
  font-weight: 100;
  padding: 0.75em;
  width: 80%;
  border-radius: 0.75em;
  border: #333;
}

.user {
    width: 80%;
    background-color:white;
    float:right;
    text-align:left;
    margin-right: 5px;
    word-wrap: break-word;
}

.assistant {
    width: 80%;
    background-color:rgb(12, 183, 27);
    float:left;
    text-align:left;
    margin-left: 5px;
}

.chat-container {
  overflow-y: scroll;
  height: 80%;
}

.chat-container::-webkit-scrollbar {
    display: none;
}

.panel {
    position: absolute;
    width: 400px;
    height: 500px;
    top: v-bind(topPx);
    left: v-bind(leftPx);
    background-color: aliceblue;
    border: 1px solid green ;
    border-radius: 0.75em;
}

.panel-header {
    font-weight: 100;
    cursor: move;
    user-select: none;
}

.message {
    padding: 0.75em;
    margin-top:10px;
    border-radius: 1em;
    border: 1px solid green;
    box-shadow: 0px 4px 6px #333;
   -moz-box-shadow: 0px 4px 6px #333;
   -webkit-box-shadow: 0px 4px 6px #333;
    display: flex;
    flex-direction: column;
}
</style>
