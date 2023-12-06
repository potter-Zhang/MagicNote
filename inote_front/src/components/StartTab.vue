<script setup>
  import notebook from "@icon-park/vue-next/lib/icons/Notebook"
  import noteIcon from "@icon-park/vue-next/lib/icons/Notes"
  import {addNotebookAPI, getNotebooksAPI} from "@/api/notebook";
  import {addNoteAPI} from "@/api/note";
  import {logAPI} from "@/api/log";
  import {currentUser, currentNotebooks, setCurrentNote, updateNotebooks} from "@/global";

  import {ref, onBeforeMount, defineEmits } from 'vue'
  import {ElMessage, ElMessageBox} from "element-plus";

  const emit = defineEmits(['jumpToNote'])
  let historyNotes = ref([]);

  const addNoteDialogVisible = ref(false);
  const selectedNotebook = ref(""); // 新建笔记时选择的笔记本
  const addNoteInput = ref("");  // 新建笔记的名称

  const loadLog = async () => {
    const response = await logAPI(currentUser.value.id);
    historyNotes.value = [];
    historyNotes.value.push.apply(historyNotes.value, response);
    historyNotes.value.reverse();

    // 找出已经被删除了的笔记id
    const deletedNotes = historyNotes.value
        .filter((item) => { return item.operation === "delete"; })
        .map((item) => item.noteid);
    historyNotes.value = historyNotes.value.filter((item, index, self) => {
      // 裁切时间
      item.timestamp = item.timestamp.split("T")[0];
      // 日志中可能会出现noteid相同但是notename不同(重命名的笔记)，因此还需要根据noteid来进行一次去重
      const idIndex = self.findIndex((t) => t.noteid === item.noteid)
      // 去除被删除的日志、同时按照笔记名字和id来进行去重
      return !deletedNotes.includes(item.noteid) && index === idIndex;
    });
  }

  // 挂载时加载历史记录和笔记本
  onBeforeMount(() => {
    loadLog();
  });

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
              .then(() => {
                // 更新笔记本
                updateNotebooks();
                ElMessage({
                  type: 'success',
                  message: `创建成功`,
                })
              });
        })
  }

  const cancelAddNote = () => {
    addNoteInput.value = "";
    addNoteDialogVisible.value = false;
    selectedNotebook.value = "";
  }

  const addNote = async () => {
    addNoteDialogVisible.value = false;
    const notebook = selectedNotebook.value;
    const newNoteName = addNoteInput.value;
    if (notebook === "") {
      ElMessage.error("请选择笔记本！");
      return;
    }
    if (newNoteName === "") {
      ElMessage.error("请输入新笔记本的名称！");
      return;
    }
    const data = {
      "userid": currentUser.value.id,
      "name": newNoteName,
      "content": "",
      "notebookid": notebook["id"]
    }
    await addNoteAPI(data)
        .then(() => {
          ElMessage.success("创建成功")
        })
        .catch(() => {
          ElMessage.error("创建失败，服务错误")
        })
  }

</script>

<template>
  <div id="main">
    <div class="title">开始</div>

    <!-- 添加笔记的对话框 -->
    <el-dialog id="add-dialog"
               v-model="addNoteDialogVisible"
               title="新建笔记"
               :align-center="true"
               style="max-width: 420px;">
      <template #default>
        <el-row>
          <el-col :span="8" style="justify-content: end; display: flex; align-items: center">
            <div>笔记本：</div>
          </el-col>
          <el-col :span="12">
            <el-select v-model="selectedNotebook" value-key="id" placeholder="请选择笔记本" style="width: 100%">
              <el-option v-for="item in currentNotebooks" :key="item.id" :label="item.name" :value="item">
                <div style="display: flex; align-items: center">
                  <notebook class="icon" theme="multi-color" size="18" :fill="['#333' ,'#a5d63f' ,'#FFF']"/>
                  <div style="margin-left: 5px; font-size: 16px">{{item.name}}</div>
                </div>
              </el-option>
            </el-select>
          </el-col>
        </el-row>
        <el-row style="margin-top: 5%">
          <el-col :span="8" style="justify-content: end; display: flex; align-items: center">
            <span>新笔记的名称：</span>
          </el-col>
          <el-col :span="12">
            <el-input v-model="addNoteInput" style="width: 100%"/>
          </el-col>
        </el-row>
      </template>
      <template #footer>
        <el-button @click="cancelAddNote">取消</el-button>
        <el-button type="primary" @click="addNote">确认</el-button>
      </template>
    </el-dialog>

    <!-- 按键功能区 -->
    <div style="display: flex;">
      <el-button class="start-button" @click="addNotebook">
        <template #default>
          <div class="button-content">
            <notebook class="icon" theme="multi-color" size="24" :fill="['#333' ,'#a5d63f' ,'#FFF']"/>
            <div style="margin: 5px 0 5px 0">新建笔记本</div>
            <el-divider/>
            <div style="white-space: pre-wrap; margin-top: 5px;line-height: 1.1rem">笔记本是笔记的集合，有助于笔记的分类和查找</div>
          </div>
        </template>
      </el-button>
      <el-button class="start-button" @click="addNoteDialogVisible=true">
        <template #default>
          <div class="button-content">
            <note-icon class="icon" theme="multi-color" size="24" :fill="['#333' ,'#a5d63f' ,'#FFF']"/>
            <div style="margin: 5px 0 5px 0">新建笔记</div>
            <el-divider/>
            <div style="white-space: pre-wrap; margin-top: 5px; line-height: 1.1rem">记录知识、记录生活的一点一滴</div>
          </div>
        </template>
      </el-button>
    </div>

    <!--历史文档区-->
    <div class="title" style="margin-top: 1rem">最近</div>
    <div v-if="historyNotes.length>0">
      <div v-for="history in historyNotes">
        <div class="history-card">
          <div style="display: flex; align-items: center; cursor: pointer">
            <note-icon class="icon" theme="multi-color" size="24" :fill="['#333' ,'#a5d63f' ,'#FFF']"/>
            <div style="margin-left: 0.5rem" @click="setCurrentNote(history.noteid, history.notename, -1);emit('jumpToNote')">
              {{history.notename}}
            </div>
          </div>
          <div style="color: rgb(200,200,200); margin-right: 10%">{{history.timestamp}}</div>
        </div>
      </div>
    </div>
    <el-empty v-else description="暂无"/>
  </div>
</template>

<style scoped>
  .el-divider--horizontal {
    margin-top: 2px;
    margin-bottom: 2px;
  }


  #main {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    padding: 1rem;
    box-sizing: border-box;
  }

  .title {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  .start-button {
    height: 9rem;
    width: 9rem;
    padding-top: 2rem;
  }
  .start-button, .start-button:focus:not(.start-button:hover){
    /*点击后自动失焦*/
    color: var(--el-button-text-color);
    background-color: var(--el-button-bg-color);
    border-color: var(--el-button-border-color);
  }

  .button-content {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    height: 8rem;
    width: 8rem;
  }

  .history-card {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid rgb(240,240,240);
    padding: 1.5rem;
  }
  .history-card:hover {
    background-color: rgb(240,240,240,0.2);
  }
</style>