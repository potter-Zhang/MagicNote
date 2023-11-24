<script setup>
  import notebook from "@icon-park/vue-next/lib/icons/Notebook"
  import noteIcon from "@icon-park/vue-next/lib/icons/Notes"
  import {addNotebookAPI} from "@/api/notebook";
  import {logAPI} from "@/api/log";
  import {currentUser} from "@/global";

  import {ref, onBeforeMount} from 'vue'
  import {ElMessage, ElMessageBox} from "element-plus";

  let historyNotes = ref([]);

  // 挂载时加载历史记录
  onBeforeMount(async () => {
    const response = await logAPI(currentUser.value.id);
    historyNotes.value = [];
    historyNotes.value.push.apply(historyNotes.value, response);
    historyNotes.value.reverse();
    // 去除删除操作的日志
    historyNotes.value = historyNotes.value.filter((item) => {
      return item.operation !== 'delete';
    });
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
          const newNotebook = await addNotebookAPI(data);
          ElMessage({
            type: 'success',
            message: `创建成功`,
          })
        })
  }

</script>

<template>
  <div id="main">
    <div class="title">开始</div>

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
      <el-button class="start-button">
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
      <div v-for="history in historyNotes" style="cursor: default">
        <div class="history-card">
          <div style="display: flex; align-items: center; cursor: pointer">
            <note-icon class="icon" theme="multi-color" size="24" :fill="['#333' ,'#a5d63f' ,'#FFF']"/>
            <div style="margin-left: 0.5rem">{{history.notename}}</div>
          </div>
<!--          <div style="color: rgb(200,200,200); width: 20%">笔记本: {{history.notebookName}}</div>-->
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