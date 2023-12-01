<script setup lang="ts">
  import {ref, onBeforeMount, onBeforeUnmount, defineEmits} from 'vue'
  import notebook from "@icon-park/vue-next/lib/icons/Notebook"
  import edit from "@icon-park/vue-next/lib/icons/Edit";
  import deleteOne from "@icon-park/vue-next/lib/icons/DeleteOne";
  import fileAdditionOne from "@icon-park/vue-next/lib/icons/FileAdditionOne";
  import folderPlus from "@icon-park/vue-next/lib/icons/FolderPlus";
  import returnIcon from "@icon-park/vue-next/lib/icons/Return"
  import noteIcon from "@icon-park/vue-next/lib/icons/Notes"
  import more from "@icon-park/vue-next/lib/icons/More"
  import plus from "@icon-park/vue-next/lib/icons/Plus"
  import left from "@icon-park/vue-next/lib/icons/Left"

  import {ElMessageBox, ElMessage} from "element-plus";
  import {getAllNotesAPI, addNoteAPI, delNoteByIdAPI, updateNoteAPI, getNoteAPI} from "@/api/note"
  import {getNotebooksAPI, addNotebookAPI, updateNotebookAPI, delNotebookByIdAPI} from "@/api/notebook"
  import {currentUser, setCurrentNote} from "@/global"
  import {globalEventBus} from "@/util/eventBus"

  const notebooks = ref([]);
  const emits = defineEmits(['collapse'])

  const getAllNotebooks = async () => {
    notebooks.value.splice(0, notebooks.value.length);
    const response = await getNotebooksAPI(currentUser.value.id);
    notebooks.value.push.apply(notebooks.value, response);
  }

  onBeforeMount(async () => {
    await getAllNotebooks();

    // StartTab新增Notebook时需要更新notebooks
    globalEventBus.on("addNotebook", async () => {
      await getAllNotebooks();
    })
  })

  onBeforeUnmount(() => {
    // 取消监听
    globalEventBus.off("addNotebook");
  })

  const currentMode = ref('notebook'); // 显示笔记本或者笔记本中的文档
  const currentNotebook = ref(-1);  // 当前正在浏览的笔记本id，在笔记本中新增笔记时需要使用

  const changeMode = (type: string) =>{
    currentMode.value = type;
  }

  const displayNotes = async (notebookId) => {
    await getNotes(notebookId);
    changeMode("note");
  }

  const renameNotebook = (notebook) => {
    ElMessageBox.prompt('新的名称', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入新的名称！',
    })
        .then(async ({ value }) => {
          const oldName = notebook.name;
          notebook.name = value;
          await updateNotebookAPI(notebook)
              .catch((err) => {
                notebook.name = oldName;
                ElMessage.error(err.response.data)
              })
        })
  }

  const delNotebook = async (notebook) => {
    await delNotebookByIdAPI(notebook.id);
    const listId = notebooks.value.indexOf(notebook);
    notebooks.value.splice(listId, 1);
  }

  const addNotebook = () => {
    ElMessageBox.prompt('新笔记本的名称', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入名称！',
    })
        .then(async ({ value }) => {
          const data = {"name": value, "userid": currentUser.value.id};
          await addNotebookAPI(data)
              .then((response) => {
                notebooks.value.push(response);
                ElMessage.success("创建成功");
              })
              .catch((err) => {
                ElMessage.error(err.response.data.message)
              })
        })
  }

  let notes = ref([]);

  const getNotes = async (notebookId) => {
    await getAllNotesAPI(notebookId)
        .then((response) => {
          notes = ref(response);
        })
  }

  const renameNote = (note) => {
    ElMessageBox.prompt('新的名称', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入新的名称！',
    })
        .then(async ({ value }) => {
          const oldName = note.name;
          note.name = value;
          await updateNoteAPI(note)
              .catch((err) => {
                note.name = oldName;
                ElMessage.error(err.response.data);
              })
        })
  }

  const delNote = async (note) => {
    await delNoteByIdAPI(note.id);
    const listId = notes.value.indexOf(note);
    notes.value.splice(listId, 1);
  }

  const addNote = () => {
    ElMessageBox.prompt('新笔记的名称', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入名称！',
    })
      .then(async ({ value }) => {
        await addNoteAPI({
          "userid": currentUser.value.id,
          "content": "",
          "name": value,
          "notebookid": currentNotebook.value
        })
            .then((response) => {
              notes.value.push(response);
              ElMessage.success("创建成功")
            })
            .catch((err) => {
              ElMessage.error(err.response.data.message)
            })
      })
  }
</script>

<template>
  <div id="body">
    <left id="collapse-btn" theme="outline" size="24" fill="#000000" @click="$emit('collapse')"/>
    <!-- 显示笔记本的操作栏 -->
    <div v-if="currentMode==='notebook'" class="operationBar">
      <el-tooltip effect="dark" content="新增笔记本" placement="bottom">
        <folder-plus class="icon" theme="outline" size="20" @click="addNotebook"/>
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
        <file-addition-one class="icon" theme="outline" size="20" @click="addNote"/>
      </el-tooltip>
    </div>

    <div id="content">
      <!-- 显示笔记本 -->
      <div v-if="currentMode==='notebook' && notebooks.length === 0">
        <div class="addBtn" @click="addNotebook">
          <plus theme="outline" size="24" fill="#c8c8c8"/>
          <div>新建笔记本</div>
        </div>
      </div>
      <div v-else-if="currentMode==='notebook' && notebooks.length > 0"  v-for="notebook in notebooks" class="display-item">
        <div class="display-item-icon-and-text"  @click="currentNotebook=notebook.id; displayNotes(notebook.id);">
          <notebook class="icon" theme="multi-color" size="16" :fill="['#333' ,'#a5d63f' ,'#FFF']"/>
          <div style="margin-left: 0.5rem; font-size: 0.8rem; font-weight: bold">{{notebook.name}}</div>
        </div>
        <!-- 弹出框进行重命名和删除操作 -->
        <el-popover placement="bottom-start" :width="100" trigger="click" hide-after="0">
          <template #default>
            <div class="popover-item" @click="renameNotebook(notebook)">
              <edit class="icon" theme="outline" size="20" fill="#000000"/>
              <div style="margin-left: 0.5rem">重命名</div>
            </div>
            <el-popconfirm width="100" confirm-button-text="确定" cancel-button-text="取消" title="确认删除？"  @confirm="delNotebook(notebook)">
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
      <div v-else-if="currentMode==='note' && notes.length === 0">
        <div class="addBtn" @click="addNote">
          <plus theme="outline" size="24" fill="#c8c8c8"/>
          <div>新建笔记</div>
        </div>
      </div>
      <div v-else-if="currentMode==='note' && notes.length > 0" class="display-item" v-for="note in notes">
        <div class="display-item-icon-and-text" @click="setCurrentNote(note.id, currentNotebook)">
         <note-icon class="icon" theme="multi-color" size="16" :fill="['#333' ,'#a5d63f' ,'#FFF']"/>
         <div style="margin-left: 5%; font-size: 0.8rem; font-weight: bold">{{note.name}}</div>
        </div>
        <!-- 弹出框进行重命名和删除操作 -->
        <el-popover placement="bottom-start" :width="100" trigger="click" hide-after="0">
          <template #default>
            <div class="popover-item" @click="renameNote(note)">
              <edit class="icon" theme="outline" size="20" fill="#000000"/>
              <div style="margin-left: 0.5rem">重命名</div>
            </div>
            <el-popconfirm width="100" confirm-button-text="确定" cancel-button-text="取消" title="确认删除？" @confirm="delNote(note)">
              <template #reference>
                <div class="popover-item">
                  <delete-one class="icon" theme="outline" size="20" fill="#000000"/>
                  <div style="margin-left: 0.5rem">删除</div>
                </div>
              </template>
            </el-popconfirm>
          </template>
          <template #reference>
            <more theme="outline" size="16" fill="#333"/>
          </template>
        </el-popover>
      </div>
    </div>

  </div>
</template>

<style scoped>
  #body {
    position: relative;
    background-color: transparent;
    display: flex;
    flex-direction: column;
  }

  #collapse-btn {
    position: absolute;
    top: 50%;
    left: 100%;
    transform: translate(-100%, -50%);
    cursor: pointer;
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

  .addBtn {
    border: 2px dashed rgb(160, 160, 160);
    border-radius: 5px;
    margin: 10px 10% 0 10%;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    color: rgb(160, 160, 160);
    padding: 5px;
  }
  .addBtn:hover {
    background-color: rgb(240,240,240, 0.5);
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