<script setup lang="ts">
import { h, ref, type Component } from 'vue'

import { useEditorStore } from '../../../store'
import { storeToRefs } from 'pinia'

const editorStore = useEditorStore()
const { headings } = storeToRefs(editorStore)
/**
 * 左侧区域
 */
const handleHeadingClick = (data) => {
  setActiveHeading(data)
}
const getQianZhui = (heading) => {
  if(heading.level == 1){
    return ''
  }else{
    var temp = "|";
    for(var i = 0; i < heading.level - 1; i++){
      temp+="->|";
    }
    return temp;
  }
}
</script>

<template>
  <div class="outline__list" style="display: flex; flex-direction: column;">
    <h2 class="text-gray-400" style="margin-left: 20px">大纲</h2>
    <template v-for="(heading, index) in headings" :key="index">
      <el-popover
          trigger="click"
          placement="right"
      >
        <template #reference>
          <el-button
              @click="handleHeadingClick(heading.text)"
              text
              class="outline__item"
              :class="`outline__item--${heading.level}`"
              round
              style="margin-left: 5px; color: black"
          >
            {{getQianZhui(heading) + heading.text }}
            <el-icon v-if="heading.icon"><component :is="heading.icon"/></el-icon>
          </el-button>
        </template>
        <!-- 如果需要弹出内容，请在这里添加 -->
      </el-popover>
    </template>
  </div>
</template>

<style scoped lang="scss">
.outline {
  opacity: 0.75;
  border-radius: 0.5rem;
  padding: 0.75rem;
  background: rgba(black, 0.1);
  .left-aligned-button {
    justify-content: flex-start; /* 对齐内容到起始位置（左边） */
    text-align: left; /* 文字左对齐 */
    padding-left: 16px; /* 根据需要调整内边距 */
  }
  &__list {
    list-style: none;
    font-size: 18px;
    padding: 0;
  }

  &__item {
    justify-content: flex-start; /* 对齐内容到起始位置（左边） */
    text-align: left; /* 文字左对齐 */
    font-size: 15px;
    a:hover {
      opacity: 0.5;
    }
    &--1 {
      font-size: 23px;
      font-weight: bold;
      padding-left: 10px;
    }
    &--3 {
      padding-left: 10px;
    }
    &--4 {
      padding-left: 2rem;
    }

    &--5 {
      padding-left: 3rem;
    }

    &--6 {
      padding-left: 4rem;
    }
  }
}
</style>
