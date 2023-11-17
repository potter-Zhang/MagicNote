<script setup lang="ts">
  import {ref} from 'vue'
  import notebook from "@icon-park/vue-next/lib/icons/Notebook"
  import edit from "@icon-park/vue-next/lib/icons/Edit";
  import deleteOne from "@icon-park/vue-next/lib/icons/DeleteOne";
  import fileAdditionOne from "@icon-park/vue-next/lib/icons/FileAdditionOne";
  import folderPlus from "@icon-park/vue-next/lib/icons/FolderPlus";
  import returnIcon from "@icon-park/vue-next/lib/icons/Return"
  import noteIcon from "@icon-park/vue-next/lib/icons/Notes"
  import more from "@icon-park/vue-next/lib/icons/More"

  const props = defineProps({
    dataSource: Array
  })

  const notes = ref([
    {
      id: 0,
      name: "文件1"
    },
    {
      id: 1,
      name: "文件2"
    },
    {
      id: 2,
      name: "文件3"
    },
    {
      id: 0,
      name: "文件1"
    },
    {
      id: 1,
      name: "文件2"
    },
    {
      id: 2,
      name: "文件3"
    },
    {
      id: 0,
      name: "文件1"
    },
    {
      id: 1,
      name: "文件2"
    },
    {
      id: 2,
      name: "文件3"
    },
    {
      id: 0,
      name: "文件1"
    },
    {
      id: 1,
      name: "文件2"
    },
    {
      id: 2,
      name: "文件3"
    },
    {
      id: 0,
      name: "文件1"
    },
    {
      id: 1,
      name: "文件2"
    },
    {
      id: 2,
      name: "文件3"
    },
    {
      id: 0,
      name: "文件1"
    },
    {
      id: 1,
      name: "文件2"
    },
    {
      id: 2,
      name: "文件3"
    }
  ])

  const currentMode = ref('notebook'); // 显示笔记本或者笔记本中的文档

  const changeMode = (type: string) =>{
    currentMode.value = type;
  }
</script>

<template>
  <div id="body">
    <!-- 显示笔记本的操作栏 -->
    <div v-if="currentMode==='notebook'" class="operationBar">
      <el-tooltip effect="dark" content="新增笔记本" placement="bottom">
        <folder-plus class="icon" theme="outline" size="20" fill="#000000"/>
      </el-tooltip>
    </div>
    <!-- 显示笔记的操作栏 -->
    <div v-else class="operationBar" style="justify-content: space-between">
      <div style="margin-left: 0.15rem">
        <el-tooltip effect="dark" content="返回笔记本" placement="bottom">
          <return-icon class="icon" theme="outline" size="20" fill="#333" style="align-self: start" @click="changeMode('notebook')"/>
        </el-tooltip>
      </div>
      <el-tooltip effect="dark" content="新增笔记" placement="bottom">
        <file-addition-one class="icon" theme="outline" size="20" fill="#000000"/>
      </el-tooltip>
    </div>

    <div id="content">
      <!-- 显示笔记本 -->
      <div v-if="currentMode==='notebook'"  v-for="notebook in dataSource" class="display-item">
        <div class="display-item-icon-and-text"  @click="changeMode('note')">
          <notebook class="icon" theme="outline" size="16" fill="#333"/>
          <div style="margin-left: 0.5rem; font-size: 0.8rem; font-weight: bold">{{notebook.name}}</div>
        </div>
        <el-popover placement="bottom-start" :width="100" trigger="click" hide-after="0">
          <template #default>
            <div class="popover-item">
              <edit class="icon" theme="outline" size="20" fill="#000000"/>
              <div style="margin-left: 0.5rem">重命名</div>
            </div>
            <el-popconfirm width="100" confirm-button-text="确定" cancel-button-text="取消" title="确认删除？">
              <template #reference>
                <div class="popover-item">
                  <delete-one class="icon" theme="outline" size="20" fill="#000000"/>
                  <div style="margin-left: 0.5rem">删除</div>
                </div>
              </template>
            </el-popconfirm>
          </template>
          <template #reference>
            <more theme="outline" size="16" fill="#333" @click=""/>
          </template>
        </el-popover>
      </div>

      <!-- 显示笔记本中的笔记 -->
      <div v-else class="display-item" v-for="note in notes">
        <div class="display-item-icon-and-text">
         <note-icon class="icon" theme="outline" size="16" fill="#333"/>
         <div style="margin-left: 5%; font-size: 0.8rem; font-weight: bold">{{note.name}}</div>
        </div>
        <el-popover placement="bottom-start" :width="100" trigger="click" hide-after="0">
          <template #default>
            <div class="popover-item">
              <edit class="icon" theme="outline" size="20" fill="#000000"/>
              <div style="margin-left: 0.5rem">重命名</div>
            </div>
            <el-popconfirm width="100" confirm-button-text="确定" cancel-button-text="取消" title="确认删除？">
              <template #reference>
                <div class="popover-item">
                  <delete-one class="icon" theme="outline" size="20" fill="#000000"/>
                  <div style="margin-left: 0.5rem">删除</div>
                </div>
              </template>
            </el-popconfirm>
          </template>
          <template #reference>
            <more theme="outline" size="16" fill="#333" @click=""/>
          </template>
        </el-popover>
      </div>
    </div>

  </div>
</template>

<style scoped>
  #body {
    background-color: transparent;
    display: flex;
    flex-direction: column;
  }

  #content {
    overflow: scroll;
    flex-grow: 0;
  }

  .operationBar {
    display: flex;
    justify-content: flex-end;
    padding: 5px 10px 5px 0;
    border-bottom: 1px solid #e9e9e9;
    background-color: white;
  }

  .display-item {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding-right: 0.7rem;
  }
  .display-item:hover {
    background-color: rgb(240,240,240,0.5);
  }

  .display-item-icon-and-text {
    display: flex;
    width: 85%;
    padding: 1rem 0.7rem 1rem 1rem;
  }

  .popover-item {
    display: flex;
    align-items: center;
    cursor:pointer;
    padding: 0.5rem;
  }
  .popover-item:hover {
    background-color: rgb(240,240,240,0.5);
    border-radius: 10px;
  }
</style>