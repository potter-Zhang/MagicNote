<script setup>
  import {defineEmits, defineProps} from "vue";
  import {setCurrentNote} from "@/global";
  import noteIcon from "@icon-park/vue-next/lib/icons/Notes"

  const props = defineProps(['notes'])

  const emit = defineEmits(['noteclick'])

  const openEditor = (noteid, name) => {
    setCurrentNote(noteid, name);
    emit('noteclick');
  }
</script>

<template>
  <div id="search-body">
    <div style="display: flex; align-items: end">
      <div style="font-size: large; margin-right: 5px">相关内容</div>
      <div style="font-size: small; color: rgb(128,128,128)">为您搜索到{{props.notes.length}}条结果</div>
    </div>

    <div v-if="props.notes.length > 0" class="search-item" v-for="note in props.notes">
        <note-icon class="icon" theme="multi-color" size="20" :fill="['#333' ,'#40afa0' ,'#FFF']"/>
        <div style="display: flex; flex-direction: column; margin-left: 10px; width: 100%">
          <div style="font-size: large; cursor:pointer" @click="openEditor(note.id, note.name)">{{note.name}}</div>
          <el-text truncated class="content-text">{{note.content}}</el-text>
        </div>
    </div>
    <el-empty description="没有找到结果" v-else/>
  </div>
</template>

<style scoped>
  #search-body {
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    padding: 15px;
    display: flex;
    flex-direction: column;
  }

  .search-item {
    box-sizing: border-box;
    display: flex;
    height: 80px;
    width: 100%;
    border-bottom: 1px solid rgb(240,240,240);
    padding: 1rem;
  }
  .search-item:hover {
    background-color: rgb(240,240,240,0.2);
  }

  .content-text {
    font-size: small;
    margin-top: 5px;
    max-width: 95% !important;
    box-sizing: border-box;
    align-self: start;
    white-space:pre-wrap;
  }
</style>