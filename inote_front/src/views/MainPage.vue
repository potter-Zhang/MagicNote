<script lang="ts" setup>
  import user from "@icon-park/vue-next/lib/icons/User";
  import allApplication from "@icon-park/vue-next/lib/icons/AllApplication";
  import transferData from "@icon-park/vue-next/lib/icons/TransferData";
  import help from "@icon-park/vue-next/lib/icons/Help";
  import receive from "@icon-park/vue-next/lib/icons/Receive";
  import search from "@icon-park/vue-next/lib/icons/Search"
  import router from "@/router/index"

  import {currentUser} from "@/global"
  import {searchAPI} from "@/api/search"
  import helpInfo from "../components/HelpInfo.vue"
  import editor from "../components/Editor.vue"
  import notebook from "../components/Notebook.vue"
  import startTab from "../components/StartTab.vue"
  import searchResultView from "@/components/SearchResult.vue"
  import {ref} from 'vue';

  const currentTab = ref("start"); // 当前展示在workspace的组件
  const searchKeyword = ref("");  // 搜索框文本
  const searchResult = ref([]); // 搜索结果

  const searchNote = async () => {
    searchResult.value.splice(0, searchResult.value.length);
    const data = {
      "userid": currentUser.value.id,
      "words": searchKeyword.value
    }
    const response = await searchAPI(data);
    if (response !== "") {
      searchResult.value.push.apply(searchResult.value, response);
    }
    changeTab("search");
  }

  const changeTab = (tab: string) => {
    currentTab.value = tab;
    if (tab != "editor") {
      const drawer = document.getElementById("notebook");
      drawer.style.width = "0";
    }
  }

  function boggleDrawer() {
    const drawer = document.getElementById("notebook");
    const width = drawer.style.width;
    const openWidth = "250px";
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

  const logout = () => {
    currentUser.value.id = -1;
    currentUser.value.name = "";
    currentUser.value.token = "";
    router.push("/");
  }

</script>

<template>
    <el-container style="height: 100vh">
      <!-- 顶部栏 -->
      <el-header id="header">
        <div id="icon-and-name" style="display: flex; align-items: center">
          <img src="/inote_filled.ico" height="24" width="24" style="margin: 0 15px 0 20px">
          <span style="font-family: 'Arial Black'; font-size: 20px; font-style: italic">MagicNote</span>
        </div>
        <el-input id="search-box" v-model="searchKeyword" @keyup.enter="searchNote">
          <template #prepend>
            <search theme="outline" size="20" fill="#000000"/>
          </template>
        </el-input>
        <div class="user-zone" v-if="currentUser.id == -1">
          <user theme="outline" size="24" fill="#333" style="margin-right: 10%"/>
          <router-link to="/" class="user-zone-font">登录</router-link>
        </div>
        <div class="user-zone" v-else>
          <router-link to="/userInfo" style="display: flex; align-items: center">
            <img src="../assets/avatar.jpg" class="avatar">
          </router-link>
          <router-link to="/userInfo" class="user-zone-font" style="margin-right: 8px">{{currentUser.name}}</router-link>
          <el-button type="danger" style="padding: 0 5px 0 5px" @click="logout">退出登录</el-button>
        </div>
      </el-header>

      <el-container>
        <!-- 侧边栏 -->
        <el-menu id="side-bar" :collapse="isCollapse" active-text-color="#a5d63f">
          <div>
            <el-menu-item index="1" @click="isCollapse=!isCollapse">
              <transfer-data theme="outline" size="24" fill="#333"/>
              <template #title><span class="menu-title">展开与收起</span></template>
            </el-menu-item>
            <el-menu-item index="2" @click="changeTab('start');">
              <all-application class="icon" theme="outline" size="24" fill="#333"/>
              <template #title><span class="menu-title">开始</span></template>
            </el-menu-item>
            <el-menu-item index="3" v-on:click="boggleDrawer(); changeTab('editor')">
              <receive class="icon" theme="outline" size="24" fill="#333"/>
              <template #title><span class="menu-title">我的笔记本</span></template>
            </el-menu-item>
          </div>
          <el-menu-item index="4" @click="changeTab('helpInfo')">
            <help class="icon" theme="outline" size="24" fill="#333"/>
            <template #title><span class="menu-title">帮助</span></template>
          </el-menu-item>
        </el-menu>

        <el-main style="padding: 0; display: flex">
          <!-- 笔记本弹窗 -->
          <div id="notebook">
            <notebook style="height: 100%"/>
          </div>

          <div id="workspace">
            <start-tab @jumpToNote="changeTab('editor')" v-if="currentTab==='start'"/>
            <editor v-else-if="currentTab==='editor'"/>
            <help-info v-else-if="currentTab==='helpInfo'"/>
            <search-result-view v-else-if="currentTab==='search'" :notes="searchResult" @noteclick="changeTab('editor')"/>
          </div>
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
    height: var(--header-height);
    --el-header-padding: 0;
  }

  .el-input {
    width: 30%;
  }

  .user-zone {
    display: flex;
    align-items: center;
    width: 10%;
    margin-right: 5%;
    min-width: min-content;
    box-sizing: border-box;
  }

  .avatar {
    border-radius: 50%;
    height: 30px;
    width: 30px;
    margin-right: 8px;
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

  #notebook {
    width: 0;
    height: calc(100vh - var(--header-height));
    background-color: white;
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.3);
    transition: width 0.2s linear;
    overflow: hidden;
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

  #workspace {
    flex: 1;
    display: flex;
    height: calc(100vh - var(--header-height));
  }
</style>