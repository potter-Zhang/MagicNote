<script setup>
  import notebookAndPen from "@icon-park/vue-next/lib/icons/NotebookAndPen";
  import user from "@icon-park/vue-next/lib/icons/User";
  import folderOpen from "@icon-park/vue-next/lib/icons/FolderOpen";
  import robotOne from "@icon-park/vue-next/lib/icons/RobotOne";
  import {ref} from 'vue';

  function boggleDrawer() {
    const drawer = document.getElementById("tree-view");
    const icon = document.getElementById("folder-icon");
    const width = drawer.style.width;
    const openWidth = "300px";
    if (width === openWidth) {
      // close
      icon.style.backgroundColor = "transparent";
      drawer.style.width = "0";
    } else {
      // open
      icon.style.backgroundColor = "#B0D9B1";
      drawer.style.width = openWidth;
    }
  }

</script>

<template>
    <el-container style="height: 100vh">
      <el-header id="header">
        <div id="icon-and-name" style="display: flex; align-items: center">
          <notebook-and-pen theme="outline" size="24" fill="#333" style="margin: 0 15px 0 20px"/>
          <span style="font-family: 'Arial Black'; font-size: 20px; font-style: italic">iNote</span>
        </div>
        <div id="user-zone">
          <user theme="outline" size="24" fill="#333"/>
          <router-link to="/login" class="user-zone-font">登录</router-link>
          <router-link to="/login" class="user-zone-font">注册</router-link>
        </div>
      </el-header>


      <el-container>
        <el-aside id="side-bar">
          <folder-open class="icon" id="folder-icon" theme="outline" fill="#333" size="90%" v-on:click="boggleDrawer"/>
          <el-divider direction="horizontal" border-style="solid" style="border-color: white; margin-top: 10%; margin-bottom: 0"/>
          <robot-one class="icon" theme="outline" size="90%" fill="#333"/>
        </el-aside>
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

  #side-bar {
    height: 100%;
    width: 3%;
    min-width: 40px;
    border-right: 1px solid white;
    background-color: #dde3d8;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .icon {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
    border: 0;
    padding: 3px;
    margin-top: 10%;
  }

  #tree-view {
    width: 0;
    background-color: #e9e9e9;
    height: 100%;
  }

  #workspace {
    font-size: 100px;
  }
</style>