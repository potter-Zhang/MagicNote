<script setup>
  import back from "@icon-park/vue-next/lib/icons/Back"
  import me from "@icon-park/vue-next/lib/icons/Me"
  import setting from "@icon-park/vue-next/lib/icons/Setting";

  const date = new Date();
  // 用于展示在时间线里的数据
  const activities = [
    {
      content: '创建了...',
      timestamp: date.toDateString(),
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
</script>

<template>
  <el-container style="height: 100vh">
    <el-header id="header">
      <div id="icon-and-name" style="display: flex; align-items: center">
        <img src="/inote_filled.ico" height="24" width="24" style="margin: 0 15px 0 20px">
        <span style="font-family: 'Arial Black'; font-size: 20px; font-style: italic">iNote</span>
      </div>
    </el-header>

    <el-main id="body" style="height: 100%; padding: 0">
      <div style="display: flex; justify-content: center">
        <router-link to="/"><back id="backIcon" theme="outline" size="24" fill="#ffffff"/></router-link>
        <div style="display: flex; flex-direction: column; flex: 1; align-items: center">
          <div id="userInfoCard">
            <me theme="outline" size="128" fill="#333" style="margin-left: 5%"/>
            <div id="info">
              <div>用户名：test</div>
              <div>个人介绍：test test test</div>
            </div>
            <div id="settingButton">
              <setting theme="outline" size="24" fill="#000000"/>
              <span style="margin-left: 5px">个人设置</span>
            </div>
          </div>

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