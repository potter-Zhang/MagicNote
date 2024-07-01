<script lang="ts" setup>
  import user from "@icon-park/vue-next/lib/icons/User";
  import allApplication from "@icon-park/vue-next/lib/icons/AllApplication";
  import help from "@icon-park/vue-next/lib/icons/Help";
  import receive from "@icon-park/vue-next/lib/icons/Receive";
  import search from "@icon-park/vue-next/lib/icons/Search"
  import router from "@/router/index"
  import afferentThree from "@icon-park/vue-next/lib/icons/AfferentThree"
  import defaultAvatar from '@/assets/default.png'

  import {currentUser, updateNotebooks} from "@/global"
  import {searchAPI} from "@/api/search"
  import helpInfo from "../components/HelpInfo.vue"
  import editor from "../components/Editor.vue"
  import notebook from "../components/Notebook.vue"
  import startTab from "../components/StartTab.vue"
  import importNote from "../components/ImportNote.vue"
  import searchResultView from "@/components/SearchResult.vue"
  import {onBeforeMount, ref, onMounted, onUnmounted} from 'vue';
  import {ElMessage} from "element-plus";

  const currentTab = ref("start"); // 当前展示在workspace的组件
  const searchKeyword = ref("");  // 搜索框文本
  const searchResult = ref([]); // 搜索结果

  onBeforeMount(() => {
    updateNotebooks();
  })

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
    searchKeyword.value = "";
    changeTab("search");
  }

  const changeTab = (tab: string) => {
    currentTab.value = tab;
    if (tab != "editor") {
      const drawer = document.getElementById("notebook");
      drawer.style.width = "0";
    }
  }

  function toggleDrawer() {
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

  function closeDrawer() {
    const drawer = document.getElementById("notebook");
    drawer.style.width = "0";
  }

  const logout = () => {
    currentUser.value.id = -1;
    currentUser.value.name = "";
    currentUser.value.token = "";
    router.push("/");

    //取消自动登录
    localStorage.removeItem('autoLogin');
    ElMessage.success("退出登录成功");
  }

  //点击magicNote同时转变侧边栏
  const triggerStartMenuItemClick = () => {
    if (startMenuItem.value && startMenuItem.value.$el) {
      startMenuItem.value.$el.click();
    } else {
      console.error('未找到目标控件或该控件没有 $el 属性');
    }
  };
  const startMenuItem = ref(null);

  //点击notebook部分外关闭notebook
  const noteBookRef = ref(null);
  // onMounted(() => {
  //   document.addEventListener('click', handleClickOutside);
  // });
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
  });
  // 处理点击事件
  const handleClickOutside = (event) => {
    // 如果点击的区域不在组件内部，则触发你想要执行的事件
    if (noteBookRef.value && !noteBookRef.value.contains(event.target)) {
      handleOutsideClick();
    }else{
      alert("111")
    }
  };
  // 处理点击组件外部的逻辑
  const handleOutsideClick = () => {
    closeDrawer();
  };
</script>

<template>
    <el-container style="height: 100vh">
      <!-- 顶部栏 -->
      <el-header id="header">
        <div id="icon-and-name" style="display: flex; align-items: center; cursor: pointer" @click="triggerStartMenuItemClick">
          <img src="/inote_filled.ico" height="24" width="24" style="margin: 0 15px 0 20px">
          <span style="font-family: 'Arial Black'; font-size: 20px; font-style: italic">MagicNote</span>
        </div>
        <!-- 搜索框 -->
        <el-input id="search-box" v-model="searchKeyword" @keyup.enter="searchNote" placeholder="搜索笔记">
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
            <img :src=currentUser.photo class="avatar" @error="e=>{e.target.src = defaultAvatar}">
          </router-link>
          <router-link to="/userInfo" class="user-zone-font" style="margin-right: 20px">{{currentUser.name}}</router-link>
          <el-button type="danger" style="padding: 0 10px 0 10px ; margin-left:10px" @click="logout">退出登录</el-button>
        </div>
      </el-header>

      <el-container>
        <!-- 侧边栏 -->
        <el-menu id="side-bar" active-text-color="#40afa0" default-active="1">
          <div>
            <el-menu-item ref= "startMenuItem" index="1" @click="changeTab('start');">
              <all-application class="icon" theme="outline" size="24" fill="#333"/>
              <template #title><span class="menu-title">开始</span></template>
            </el-menu-item>
            <el-menu-item index="2" @click="toggleDrawer(); changeTab('editor')">
              <receive class="icon" theme="outline" size="24" fill="#333"/>
              <template #title><span class="menu-title">笔记本</span></template>
            </el-menu-item>
            <el-menu-item index="3" @click="changeTab('import')">
              <afferent-three theme="outline" size="24" fill="#000000"/>
              <template #title><span class="menu-title">导入笔记</span></template>
            </el-menu-item>
          </div>
          <el-menu-item index="4" @click="changeTab('helpInfo')">
            <help class="icon" theme="outline" size="24" fill="#333"/>
            <template #title><span class="menu-title">帮助</span></template>
          </el-menu-item>
        </el-menu>

        <el-main style="padding: 0; display: flex">
          <!-- 笔记本弹窗 -->
          <div id="notebook" ref="noteBookRef">
            <notebook style="height: 100%" @collapse="toggleDrawer"/>
          </div>

          <!-- 工作区 -->
          <div id="workspace" @click="closeDrawer">
            <start-tab v-if="currentTab==='start'" @jumpToNote="changeTab('editor')"/>
            <editor v-else-if="currentTab==='editor'" @click="closeDrawer"/>
            <help-info v-else-if="currentTab==='helpInfo'"/>
            <search-result-view v-else-if="currentTab==='search'" :notes="searchResult" @noteclick="changeTab('editor')"/>
            <import-note v-show="currentTab==='import'"/>
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
    background-color: #8fefdd;
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
    z-index: 999;
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
    width: 130px;
  }


  .menu-title {
    margin-left: 10px;
    font-size: medium;
    font-weight: bold;
  }

  #workspace {
    flex: 1;
    display: flex;
    height: calc(100vh - var(--header-height));
    width: calc(100vw - 130px);
  }
</style>