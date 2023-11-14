<script lang="ts" setup>
  import user from "@icon-park/vue-next/lib/icons/User";
  import robotOne from "@icon-park/vue-next/lib/icons/RobotOne";
  import transferData from "@icon-park/vue-next/lib/icons/TransferData";
  import help from "@icon-park/vue-next/lib/icons/Help";
  import notebook from "@icon-park/vue-next/lib/icons/Notebook"
  import folderOpen from "@icon-park/vue-next/lib/icons/FolderOpen"
  import notes from "@icon-park/vue-next/lib/icons/Notes"
  import fileAdditionOne from "@icon-park/vue-next/lib/icons/FileAdditionOne"
  import folderPlus from "@icon-park/vue-next/lib/icons/FolderPlus"
  import deleteOne from "@icon-park/vue-next/lib/icons/DeleteOne"

  import type Node from 'element-plus/es/components/tree/src/model/node'
  import {ref} from 'vue';

  function boggleDrawer() {
    const drawer = document.getElementById("tree-view");
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

  // 树形控件需要用到的数据结构
  interface Tree {
    id: number
    label: string
    children?: Tree[]
  }

  // 指定Tree中哪个属性对应children和label
  const props = {
    children: "children",
    label: "label"
  }

  const dataSource = ref<Tree[]>([
    {
      id: 0,
      label: '文件夹1',
      children: [
        {
          id: 1,
          label: '文件夹1-1',
          children: [
            {
              id: 2,
              label: '文件1-1-1',
            },
          ],
        },
      ],
    },
    {
      id: 3,
      label: '文件夹2',
      children: [
        {
          id: 4,
          label: '文件夹2-1',
          children: [
            {
              id: 5,
              label: '文件2-1-1',
            },
          ],
        },
        {
          id: 6,
          label: '文件夹2-2',
          children: [
            {
              id: 7,
              label: '文件2-2-1',
            },
          ],
        },
      ],
    },
    {
      id: 8,
      label: '文件夹3',
      children: [
        {
          id: 9,
          label: '文件夹3-1',
          children: [
            {
              id: 10,
              label: '文件3-1-1',
            },
          ],
        },
        {
          id: 11,
          label: '文件夹3-2',
          children: [
            {
              id: 12,
              label: '文件3-2-1',
            },
          ],
        },
      ],
    },
  ])

  var selectedNodeParent = null;
  var selectedNode: Tree = null;

  const selectNode = (data: Tree, node: Node) => {
    selectedNode = data;
    selectedNodeParent = node.parent.data;
  }

  const addNode = (type: string) => {
    if (selectedNode == null || selectedNode.children == null)
      return;
    const newNode: Tree = {id: -1, label: type}
    if (type === "dir")
      newNode.children = [];
    selectedNode.children.push(newNode);
  }

  const delNode = () => {
    if (selectedNode == null)
      return;
    // 选中的是根节点的话没有parent
    let children: Tree[] = selectedNodeParent.children ? selectedNodeParent.children:selectedNodeParent;
    const index = children.findIndex((d) => d.id === selectedNode.id);
    children.splice(index, 1);
  }
</script>

<template>
    <el-container style="height: 100vh">
      <el-header id="header">
        <div id="icon-and-name" style="display: flex; align-items: center">
          <img src="/inote_filled.ico" height="24" width="24" style="margin: 0 15px 0 20px">
          <span style="font-family: 'Arial Black'; font-size: 20px; font-style: italic">iNote</span>
        </div>
        <div id="user-zone">
          <router-link to="/userInfo"><user theme="outline" size="24" fill="#333"/></router-link>
          <router-link to="/login" class="user-zone-font">登录</router-link>
          <router-link to="/login" class="user-zone-font">注册</router-link>
        </div>
      </el-header>

      <el-container>
        <el-menu id="side-bar" :collapse="isCollapse" active-text-color="#a5d63f">
          <div>
            <el-menu-item index="1" @click="isCollapse=!isCollapse">
              <transfer-data theme="outline" size="24" fill="#333"/>
              <template #title><span class="menu-title">展开与收起</span></template>
            </el-menu-item>
            <el-menu-item index="2" v-on:click="boggleDrawer">
              <notebook class="icon" theme="outline" size="24" fill="#333"/>
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
          <div id="tree-view">
            <div id="operationBar">
              <delete-one class="icon" theme="outline" size="20" fill="#000000" style="padding-right: 5px" @click="delNode"/>
              <file-addition-one class="icon" theme="outline" size="20" fill="#000000" @click="addNode('file')" style="padding-right: 5px"/>
              <folder-plus class="icon" theme="outline" size="20" fill="#000000" @click="addNode('dir')"/>
            </div>

            <el-tree :data="dataSource" :props="props"
                     @node-click="selectNode"
                     node-key="id"
                     style="font-size: 16px; font-weight: bold">
              <template #default="{ node, data }">
              <span>
                <folder-open v-if="data.children" theme="outline" size="16" fill="#333" style="margin-right: 5px"/>
                <notes v-else theme="outline" size="16" fill="#a5d63f" style="margin-right: 5px"/>
                <span>{{ node.label }}</span>
              </span>
              </template>
            </el-tree>
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
    background-color: white;
    height: 100%;
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.3);
    transition: width 0.2s linear;
    overflow: hidden;
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

  #operationBar {
    display: flex;
    justify-content: flex-end;
    padding: 5px 10px 5px 0;
    border-bottom: 1px solid #e9e9e9;
  }
</style>