<script setup>
  import back from "@icon-park/vue-next/lib/icons/Back"
</script>

<template>
  <el-container style="height: 100vh">
    <el-header id="header">
      <div id="icon-and-name" style="display: flex; align-items: center">
        <img src="/inote_filled.ico" height="24" width="24" style="margin: 0 15px 0 20px">
        <span style="font-family: 'Arial Black'; font-size: 20px; font-style: italic">iNote</span>
      </div>
    </el-header>

    <el-main id="body" style="height: 100%">
      <router-link to="/"><back id="backIcon" theme="outline" size="24" fill="#ffffff"/></router-link>
    </el-main>
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

  #backIcon {
    border: 1px solid #a5d63f;
    border-radius: 5px;
    background-color: #a5d63f;
    padding: 4px;
    cursor: pointer;
  }

  #infoBox {
    height: 100px;
    width: 90%;
    background-color: #e9e9e9;
    border-radius: 10px;
  }
</style>