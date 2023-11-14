<script setup>

</script>

<template>
  <div id="mainBody">
    <el-tabs :tab-position="'left'" style="width: 70%">
      <el-tab-pane label="写作编辑">
        <div class="helpCard">

        </div>
      </el-tab-pane>
      <el-tab-pane label="AI辅助">
        <div class="helpCard">

        </div>
      </el-tab-pane>
    </el-tabs>
  </div>

</template>

<style scoped>
  #mainBody {
    display: flex;
    justify-content: center;
    padding-top: 2%;
    flex: 1;
  }

  .helpCard {
    background-color: #e9e9e9;
    height: 300px;
    border-radius: 10px;
    margin-left: 1%;
  }
</style>

<style>
  .el-tabs__item.is-active {
    color: #a5d63f !important;
  }
  .el-tabs__item {
    font-size: 20px;
  }
  .el-tabs__item:hover {
    color: #a5d63f !important;
  }
  .el-tabs__active-bar {
    background-color: #a5d63f !important;
  }
</style>