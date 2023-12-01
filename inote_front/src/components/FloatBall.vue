<script setup>
  import robotOne from "@icon-park/vue-next/lib/icons/RobotOne";
  import close from "@icon-park/vue-next/lib/icons/Close"
  import aiDialog from "./DialogPanel.vue"

  import {ref} from 'vue'

  const visible = ref(false);

  function hide() {
    visible.value = false
  }

  function dragElement() {
    const element = document.getElementById("ball");
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    element.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e.preventDefault();
      // 在启动时获取鼠标光标位置:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // 每当光标移动时调用一个函数:
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      visible.value = false;
      e.preventDefault();
      // 计算新的光标位置:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // 设置元素的新位置:
      element.style.top = (element.offsetTop - pos2) + "px";
      element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
      // 释放鼠标按钮时停止移动:
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }
</script>

<template>
  <el-popover :visible="visible" placement="top-end" :width="400" >
    <template #reference>
      <div id="ball" @click="visible=!visible" @mousedown="dragElement">
        <robot-one v-if="!visible" class="icon" theme="outline" size="24" fill="#ffffff"/>
        <close v-else class="icon" theme="outline" size="20" fill="#ffffff"/>
      </div>
    </template>
    <ai-dialog :visible="visible" @close="hide"/>
  </el-popover>
</template>

<style scoped>
  #ball {
    cursor: pointer;
    position: absolute;
    top: 85vh;
    left: 90vw;
    z-index: 10;
    height: 50px;
    width: 50px;
    background-color: #a5d63f;
    border-radius: 50%;
    box-shadow: 2px 2px 2px rgb(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

</style>