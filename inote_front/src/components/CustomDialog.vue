<script setup>
import { defineProps, computed } from 'vue'
import copyOne from "@icon-park/vue-next/lib/icons/CopyOne";
import {ElMessage} from "element-plus";

const props = defineProps({
  role: { type: String, default: '' },
  content: { type: String, default: '' }
})

const role = computed({
  get () {
    return 'message ' + props.role
  }
})

const displayPositionStyle = computed({
  get() {
    if (props.role === 'assistant') {
      return {alignItems: "start"};
    }
    else {
      return {alignItems: "end"};
    }
  }
})

const copyMsg = () => {
  navigator.clipboard.writeText(props.content);
  ElMessage.success("已复制到剪贴板")
}

</script>

<template>
  <div class="msg-container" :style="displayPositionStyle">
    <div :class="role">
      {{ props.content }}
    </div>
    <div class="msg-footer" v-if="props.role==='assistant'">
      <div id="copy" @click="copyMsg">
        <copy-one class="icon" theme="outline" size="16" fill="#888888"/>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .msg-container {
    width: 100%;
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    justify-content: end;
  }
  .msg-container::after {
    content: "";
    display: block;
    clear: both;
  }

  .msg-footer {
    flex: 1;
    margin-top: 5px;
    width: 90%;
    display: flex;
    align-items: center;
    justify-content: end;
  }

  #copy {
    height: 16px;
    width: 16px;
    border-radius: 50%;
    padding: 8px;
    background-color: rgb(240,240,240);
  }

  .message {
    padding: 0.75em;
    border-radius: 1em;
    display: flex;
    flex-direction: column;
  }


  .user {
    width: 80%;
    background-color: rgb(240,240,240, 0.6);
    text-align:left;
    margin-right: 5px;
    word-wrap: break-word;
  }

  .assistant {
    width: 80%;
    background-color: var(--el-color-primary);
    color: white;
    text-align:left;
    margin-left: 5px;
  }
</style>
