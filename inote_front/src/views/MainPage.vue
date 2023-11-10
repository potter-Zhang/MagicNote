<script setup>
  import notebookAndPen from "@icon-park/vue-next/lib/icons/NotebookAndPen";
  import user from "@icon-park/vue-next/lib/icons/User";
  import folderOpen from "@icon-park/vue-next/lib/icons/FolderOpen";
  import robotOne from "@icon-park/vue-next/lib/icons/RobotOne";
  import transferData from "@icon-park/vue-next/lib/icons/TransferData";
  import help from "@icon-park/vue-next/lib/icons/Help";
  import {ref} from 'vue';

  function boggleDrawer() {
    const drawer = document.getElementById("tree-view");
    const width = drawer.style.width;
    const openWidth = "300px";
    if (width === openWidth) {
      // close
      drawer.style.width = "0";
    } else {
      // open
      drawer.style.width = openWidth;
    }
  }

  // 侧边菜单是否折叠
  const isCollapse = ref(true);
</script>

<template>
    <el-container style="height: 100vh">
      <el-header id="header">
        <div id="icon-and-name" style="display: flex; align-items: center">
<!--          <notebook-and-pen theme="outline" size="24" fill="#333" style="margin: 0 15px 0 20px"/>-->
          <img src="/inote_filled.ico" height="24" width="24" style="margin: 0 15px 0 20px">
          <span style="font-family: 'Arial Black'; font-size: 20px; font-style: italic">iNote</span>
        </div>
        <div id="user-zone">
          <user theme="outline" size="24" fill="#333"/>
          <router-link to="/login" class="user-zone-font">登录</router-link>
          <router-link to="/login" class="user-zone-font">注册</router-link>
        </div>
      </el-header>

      <el-container>
        <el-menu id="side-bar" :collapse="isCollapse">
          <div>
            <el-menu-item index="1" @click="isCollapse=!isCollapse">
              <transfer-data theme="outline" size="24" fill="#333"/>
              <template #title><span class="menu-title">展开与收起</span></template>
            </el-menu-item>
            <el-menu-item index="2" v-on:click="boggleDrawer">
              <folder-open class="icon" id="folder-icon" theme="outline" fill="#333" size="24"/>
              <template #title><span class="menu-title">我的笔记</span></template>
            </el-menu-item>
            <el-menu-item index="3">
              <robot-one class="icon" theme="outline" size="24" fill="#333"/>
              <template #title><span class="menu-title">AI</span></template>
            </el-menu-item>
          </div>
          <el-menu-item index="4">
            <help class="icon" theme="outline" size="24" fill="#333"/>
            <template #title><span class="menu-title">帮助</span></template>
          </el-menu-item>
        </el-menu>

        <el-main id="workspace" style="padding: 0">
          <el-container id="tree-view"></el-container>
        </el-main>
      </el-container>

    </el-container>

</template>

<style scoped>
  #header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #a5d63f;
    width: 100%;
    height: 60px;
    --el-header-padding: 0;
  }

  #user-zone {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 10%;
    margin-right: 5%;
    min-width: min-content;
    box-sizing: border-box;
  }

  .user-zone-font {
    cursor: pointer;
    font-weight: bold;
    border: 1px solid transparent;
    text-decoration: none;
    color: black;
    font-size: 16px;
    min-width: 34px;
  }
  .user-zone-font:hover {
    border: 0;
    border-radius: 8px;
    padding: 5px;
    background-color: rgb(240, 240, 245, 0.5);
  }

  .icon {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 0;
  }

  #tree-view {
    width: 0;
    background-color: #e9e9e9;
    height: 100%;
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.3);
  }

  #workspace {
    font-size: 100px;
  }

  #side-bar {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  #side-bar:not(.el-menu--collapse) {
    width: 150px;
    height: 100%;
  }

  .menu-title {
    margin-left: 10px;
    font-size: 16px;
    font-weight: bold;
  }
</style>