<script setup>
  import back from "@icon-park/vue-next/lib/icons/Back"
  import me from "@icon-park/vue-next/lib/icons/Me"
  import setting from "@icon-park/vue-next/lib/icons/Setting";

  import {ref} from 'vue';
  import {ElMessageBox} from "element-plus";

  const date = new Date();
  // 用于展示在时间线里的数据
  const activities = [
    {
      content: '创建了...',
      timestamp: date.toLocaleDateString(),
      type: 'add'
    },
    {
      content: '修改了...',
      timestamp: '2018-04-13',
      type: 'update'
    },
    {
      content: '删除了...',
      timestamp: '2018-04-11',
      type: 'delete'
    }
  ]

  const settingDialogVisible = ref(false);

  let userInfo = ref({
    id: 0,
    name: "test",
    description: "test test test"
  });

  let newUserInfo = ref({
    name: userInfo.value.name,
    description: userInfo.value.description
  });

  const cancelSetting = () => {
    settingDialogVisible.value = false;
    newUserInfo.value.name = userInfo.value.name;
    newUserInfo.value.description = userInfo.value.description;
  }

  const confirmSetting = () => {
    settingDialogVisible.value = false;

    if (newUserInfo.value.name === "") {
      ElMessageBox.alert("用户名不能为空！");
      newUserInfo.value.name = userInfo.value.name;
      newUserInfo.value.description = userInfo.value.description;
      return;
    }
    userInfo.value.name = newUserInfo.value.name;
    userInfo.value.description = newUserInfo.value.description;
  }

</script>

<template>
  <el-container style="height: 100vh">
    <el-header id="header">
      <div id="icon-and-name" style="display: flex; align-items: center">
        <img src="/inote_filled.ico" height="24" width="24" style="margin: 0 15px 0 20px">
        <span style="font-family: 'Arial Black'; font-size: 20px; font-style: italic">MagicNote</span>
      </div>
    </el-header>

    <el-main id="body" style="height: 100%; padding: 0">
      <div style="display: flex; justify-content: center">
        <router-link to="/dashboard"><back id="backIcon" theme="outline" size="24" fill="#ffffff"/></router-link>
        <div style="display: flex; flex-direction: column; flex: 1; align-items: center">
          <div id="userInfoCard">
            <me theme="outline" size="128" fill="#333" style="margin-left: 5%"/>
            <div id="info">
              <div>用户名：{{ userInfo.name }}</div>
              <div>个人介绍：{{userInfo.description}}</div>
            </div>
            <div id="settingButton" @click="settingDialogVisible=true">
              <setting theme="outline" size="24" fill="#000000"/>
              <span style="margin-left: 5px">个人设置</span>
            </div>
          </div>

          <el-dialog v-model="settingDialogVisible" title="个人设置" width="30%"
                     :close-on-click-modal="false" :close-on-press-escape="false"
                     :show-close="false" style="border-radius: 10px">
            <div style="display: flex; align-items: center">
              <me theme="outline" size="96" fill="#333"/>
              <el-upload action="localhost:8080/upload" style="margin-left: 10%">
                <el-button type="primary">上传头像</el-button>
              </el-upload>
            </div>
            <div style="margin-bottom: 5px; margin-top: 20px">昵称</div>
            <el-input v-model="newUserInfo.name" style="margin-bottom: 20px"/>
            <div style="margin-bottom: 5px">个人介绍</div>
            <el-input v-model="newUserInfo.description"/>
            <template #footer>
              <el-button type="danger" @click="cancelSetting">取消</el-button>
              <el-button type="primary" @click="confirmSetting">确定</el-button>
            </template>
          </el-dialog>

          <div id="beneath" style="width: 55%; margin-top: 10px">
            <div style="font-size: 20px">动态</div>
            <el-timeline id="timeline">
              <el-timeline-item v-for="(activity, index) in activities" :key="index" :timestamp="activity.timestamp" :placement="'top'">
                <el-card>
                  <template #header>
                    <div style="display: flex; justify-content: flex-end; font-size: 10px; color: rgb(0,0,0,0.3)">
                      一天前
                    </div>
                  </template>
                  {{activity.content}}
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>
      </div>

    </el-main>
  </el-container>
</template>

<style scoped>
  html {
    font-size: 10px;
  }

  #header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #a5d63f;
    width: 100%;
    height: var(--header-height);
    --el-header-padding: 0;
  }

  #backIcon {
    border: 1px solid #a5d63f;
    border-radius: 5px;
    background-color: #a5d63f;
    padding: 4px;
    cursor: pointer;
    margin: 5px 0 0 5px;
  }

  #userInfoCard {
    width: 60%;
    min-height: 200px;
    background-color: rgb(204, 204, 204, 0.11);
    border-radius: 10px;
    margin: 15px 0 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    overflow: hidden;
  }

  #info {
    margin-left: 5%;
    width: 50%;
    height: 40%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  #settingButton {
    border-radius: 10px;
    border: 1px solid #b8b8b8;
    align-self: flex-start;
    display: flex;
    justify-content: center;
    padding: 5px;
    margin-top: 20px;
    margin-right: 20px;
    cursor: pointer;
    min-width: 115px;
  }

  #timeline {
    width: 100%;
    padding-left: 20px;
    margin-top: 20px;
  }
</style>