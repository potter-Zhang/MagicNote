<script setup>
  import notebook from "@icon-park/vue-next/lib/icons/Notebook"
  import noteIcon from "@icon-park/vue-next/lib/icons/Notes"
  import {addNotebookAPI} from "@/api/notebook";
  import {logAPI} from "@/api/log";
  import {currentUser} from "@/global";

  import {ref, onMounted} from 'vue'

  const date = new Date();

  let historyNotes = ref([]);

  onMounted(async () => {
    const response = await logAPI(currentUser.value.id);
    historyNotes = ref(response);
  });
  // const historyNotes = ref([
  //   {
  //     id: 0,
  //     name: "文档1",
  //     notebookName: "生活",
  //     timestamp: date.toLocaleDateString()
  //   },
  //   {
  //     id: 1,
  //     name: "文档2",
  //     notebookName: "知识",
  //     timestamp: date.toLocaleDateString()
  //   },
  //   {
  //     id: 2,
  //     name: "文档3",
  //     notebookName: "知识",
  //     timestamp: date.toLocaleDateString()
  //   },
  //   {
  //     id: 3,
  //     name: "文档4",
  //     notebookName: "知识",
  //     timestamp: date.toLocaleDateString()
  //   },
  //   {
  //     id: 4,
  //     name: "文档5",
  //     notebookName: "知识",
  //     timestamp: date.toLocaleDateString()
  //   },
  //   {
  //     id: 5,
  //     name: "文档6",
  //     notebookName: "知识",
  //     timestamp: date.toLocaleDateString()
  //   },
  //   {
  //     id: 6,
  //     name: "文档7",
  //     notebookName: "知识",
  //     timestamp: date.toLocaleDateString()
  //   },
  //   {
  //     id: 7,
  //     name: "文档8",
  //     notebookName: "知识",
  //     timestamp: date.toLocaleDateString()
  //   }
  // ])

  const addNotebook = async (notebookName) => {
    const data = {
      userid: currentUser.value.id,
      name: notebookName
    }
    const result = await addNotebookAPI(notebookName);
    const notebookId = result['data']['id'];
  }
</script>

<template>
  <div id="main">
    <div class="title">开始</div>

    <!-- 按键功能区 -->
    <div style="display: flex;">
      <el-button class="start-button">
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
    <div v-if="historyNotes.length > 0" style="display: flex; flex-direction: column">
      <div v-for="history in historyNotes" style="cursor: default">
        <div class="history-card">
          <div style="display: flex; align-items: center; cursor: pointer">
            <note-icon class="icon" theme="multi-color" size="24" :fill="['#333' ,'#a5d63f' ,'#FFF']"/>
            <div style="margin-left: 0.5rem">{{history.name}}</div>
          </div>
          <div style="color: rgb(200,200,200); width: 20%">笔记本: {{history.notebookName}}</div>
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