<script setup>
  import robotOne from "@icon-park/vue-next/lib/icons/RobotOne";
  import close from "@icon-park/vue-next/lib/icons/Close"
  import aiDialog from "./DialogPanel.vue"

  import {onBeforeUnmount, onMounted, ref} from 'vue'
  import {globalEventBus} from "@/util/eventBus";

  const visible = ref(false);

  function hide() {
    visible.value = false
  }

  function toggle() {
    if (visible.value === false) {
      // 通知AIBubble关闭
      globalEventBus.emit("DialogPanelOpen");
    }
    visible.value = !visible.value;
  }

  onMounted(() => {
    // AIBubble打开则对话窗口关闭
    globalEventBus.on("AIBubbleOpen", () => {
      visible.value = false;
    })
  })

  onBeforeUnmount(() => {
    globalEventBus.off("AIBubbleOpen");
  })

  function dragElement() {
    const element = document.getElementById("ball");
    // 让ai-bubble跟着一起移动
    const bubble = document.getElementById("bubble");
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
      // 拖动元素时丢失mousedown事件，避免拖动完成后触发click事件
      element.style.pointerEvents = 'none';
      e.preventDefault();
      // 计算新的光标位置:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // 设置元素的新位置:
      element.style.top = (element.offsetTop - pos2) + "px";
      element.style.left = (element.offsetLeft - pos1) + "px";
      bubble.style.top = (element.offsetTop - pos2) + "px";
      bubble.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
      // 重新开始监听事件，恢复点击行为
      element.style.pointerEvents = null;
      // 释放鼠标按钮时停止移动:
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }
</script>

<template>
  <el-popover :visible="visible" placement="top-end" :width="400" >
    <template #reference>
      <div id="ball" @click="toggle" @mousedown="dragElement">
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