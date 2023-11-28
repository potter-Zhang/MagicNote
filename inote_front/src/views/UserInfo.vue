<script setup>
  import back from "@icon-park/vue-next/lib/icons/Back"
  import me from "@icon-park/vue-next/lib/icons/Me"
  import setting from "@icon-park/vue-next/lib/icons/Setting";
  import agreement from "@icon-park/vue-next/lib/icons/Agreement";
  import tips from "@icon-park/vue-next/lib/icons/Tips";
  import userBackground from "@/assets/userBackground.jpg"

  import {onBeforeMount, ref} from 'vue';
  import {ElMessageBox} from "element-plus";
  import {logAPI} from "@/api/log";
  import {updateUsernameAPI, updateProfileAPI} from "@/api/user";
  import {currentUser} from "@/global";

  const logs = ref([]);
  const loadLog = async () => {
    const response = await logAPI(currentUser.value.id);
    logs.value = [];
    logs.value.push.apply(logs.value, response);
    logs.value.reverse();
    logs.value.splice(10);
    logs.value = logs.value.filter((item) => {
      // 生成展示内容
      switch (item.operation) {
        case "add":
          item.content = "添加了笔记：" + item.notename;
          item.color = "#a5d63f"
          break;
        case "delete":
          item.content = "删除了笔记：" + item.notename;
          item.color = "#ca5863"
          break;
        case "update":
          item.content = "更新了笔记：" + item.notename;
          item.color = "#0080ff"
          break;
      }
      // 生成时间间隔
      const logDate = new Date(item.timestamp);
      const timeDiff = Date.now() - logDate.getTime();
      const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      item.dayDiff = dayDiff > 0 ? dayDiff + "天前" : "今天";
      // 裁切时间
      item.timestamp = item.timestamp.split("T")[0];
      return true;
    });
  }

  onBeforeMount(async () => {
    await loadLog();
  })

  const settingDialogVisible = ref(false);

  let newUserInfo = ref({
    name: currentUser.value.name,
    profile: currentUser.value.profile
  });

  const cancelSetting = () => {
    settingDialogVisible.value = false;
    newUserInfo.value.name = currentUser.value.name;
    newUserInfo.value.profile = currentUser.value.profile;
  }

  const confirmSetting = async () => {
    settingDialogVisible.value = false;

    if (newUserInfo.value.name === "") {
      ElMessageBox.alert("用户名不能为空！");
      newUserInfo.value.name = currentUser.value.name;
      newUserInfo.value.profile = currentUser.value.profile;
      return;
    }
    const data = {
      "id": currentUser.value.id,
      "name": newUserInfo.value.name,
      "profile": newUserInfo.value.profile
    }
    await updateUsernameAPI(data);
    await updateProfileAPI(data);
    currentUser.value.name = newUserInfo.value.name;
    currentUser.value.profile = newUserInfo.value.profile;
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


      <!-- 用户信息卡片 -->
      <div style="display: flex; justify-content: center">
        <!-- 返回按钮和主体部分分占两列 -->
        <router-link to="/dashboard"><back id="backIcon" theme="outline" size="24" fill="#ffffff"/></router-link>

        <!-- 主体部分 -->
        <div style="display: flex; flex-direction: column; flex: 1; align-items: center">
          <!-- 用户信息部分 -->
          <div style="display: flex; width: 70%; margin-top: 3%; margin-bottom: 3%">
            <div id="avatarCard" :style="{backgroundImage: `url(${userBackground})`}">
              <div class="mask">
                <div class="avatar-and-name" style="z-index: 1; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                  <img src="../assets/avatar.jpg" class="avatar">
                  <div style="font-size: 1.5rem; color: white; font-weight: bolder">{{currentUser.name}}</div>
                </div>
              </div>
              <div id="settingButton" @click="settingDialogVisible=true" style="position: absolute; bottom: -20px; left: 50%; transform: translate(-50%, 0%);">
                <setting theme="outline" size="24" fill="#000000"/>
                <span style="margin-left: 5px">个人设置</span>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; flex: 1;">
              <div class="content-card" style="margin: 0 5px 5px 15px;">
                <div class="icon-box">
                  <agreement theme="outline" fill="#ffffff" size="96"/>
                  <div style="font-weight: bolder; color: white">个人介绍</div>
                </div>
                <div style="margin: 3%; max-height: 100px; max-width: 60%;overflow: scroll">
                  <span>{{currentUser.profile}}</span>
                </div>
              </div>
              <div class="content-card" style="margin: 5px 5px 0 15px">
                <div class="icon-box">
                  <tips theme="outline" size="96" fill="#ffffff"/>
                  <div style="font-weight: bolder; color: white">每日灵感</div>
                </div>
                <div style="margin: 3%; max-height: 100px; max-width: 60%;overflow: scroll">
                  <span>暂无</span>
                </div>
              </div>
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
            <el-input v-model="newUserInfo.profile"/>
            <template #footer>
              <el-button type="danger" @click="cancelSetting">取消</el-button>
              <el-button type="primary" @click="confirmSetting">确定</el-button>
            </template>
          </el-dialog>

          <!-- 时间线 -->
          <div id="beneath" style="width: 55%; margin-top: 10px">
            <div style="font-size: 20px">动态</div>
            <el-timeline id="timeline">
              <el-timeline-item v-for="(log, index) in logs" :key="index" :timestamp="log.timestamp" :placement="'top'" :color="log.color">
                <el-card>
                  <template #header>
                    <div style="display: flex; justify-content: flex-end; font-size: 10px; color: rgb(0,0,0,0.3)">
                      {{ log.dayDiff }}
                    </div>
                  </template>
                  {{log.content}}
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

  .mask {
    background-color: rgba(165, 214, 63, 0.9);
    position: absolute;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    justify-content: end;
    align-items: center;
  }

  #avatarCard {
    display: flex;
    flex-direction: column;
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.25);
    width: 40%;
    height: 300px;
    position: relative;
    background-size: 100% 100%
  }

  .avatar {
    border-radius: 50%;
    height: 128px;
    width: 128px;
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
    background-color: white;
  }
  #settingButton:hover {
    background-color: rgb(240, 240, 240);
  }

  .content-card {
    flex: 1;
    background-color: white;
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.25);
    display: flex;
    align-items: center;
  }

  .icon-box {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 30%;
    background-color: #a5d63f;
  }

  #timeline {
    width: 100%;
    padding-left: 20px;
    margin-top: 20px;
  }
</style>