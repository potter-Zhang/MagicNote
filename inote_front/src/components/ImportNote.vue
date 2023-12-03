<script setup>
  import filePdfOne from "@icon-park/vue-next/lib/icons/FilePdfOne";
  import filePpt from "@icon-park/vue-next/lib/icons/FilePpt";
  import videoTwo from "@icon-park/vue-next/lib/icons/VideoTwo";
  import wavesLeft from "@icon-park/vue-next/lib/icons/WavesLeft";
  import notebookIcon from "@icon-park/vue-next/lib/icons/Notebook"

  import {ref} from "vue";

  import {currentNotebooks, currentUser} from "@/global";

  import '@/static/zepto/distrib/zepto.js'
  import '@/static/editor.md/editormd.min.js'
  import {ElMessage} from "element-plus";
  import {addNoteAPI} from "@/api/note";

  const previewText = ref("长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文" +
      "本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文"+
  "长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文"+
  "长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文"+
  "长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文本长文")

  const selectedNotebook = ref("");
  const newNoteName = ref("");

  const addNote = () => {
    const notebook = selectedNotebook.value;
    if (notebook === "") {
      ElMessage.error("请选择笔记本！");
      return;
    }
    if (newNoteName.value === "") {
      ElMessage.error("请输入新笔记本的名称！");
      return;
    }
    if (previewText.value === "") {
      ElMessage.error("导入文本为空！");
      return;
    }
    const data = {
      "userid": currentUser.value.id,
      "name": newNoteName.value,
      "content": previewText.value,
      "notebookid": notebook["id"]
    }
    addNoteAPI(data)
        .then(() => {
          ElMessage.success("创建成功")
        })
        .catch((err) => {
          ElMessage.error(err.response.data.message)
        })
  }
</script>

<template>
  <div id="import-body">
    <!-- 选项 -->
    <div id="option-bar">
      <el-button class="upload-btn" type="primary">
        <div style="display: flex; align-items: center">
          <file-pdf-one theme="outline" size="30" fill="#ffffff"/>
          <div class="btn-text">从pdf导入</div>
        </div>
      </el-button>
      <el-button class="upload-btn" type="primary">
        <div style="display: flex; align-items: center">
          <file-ppt theme="outline" size="30" fill="#ffffff"/>
          <div class="btn-text">从ppt导入</div>
        </div>
      </el-button>
      <el-button class="upload-btn" type="primary">
        <div style="display: flex; align-items: center">
          <video-two theme="outline" size="30" fill="#ffffff"/>
          <div class="btn-text">从视频导入</div>
        </div>
      </el-button>
      <el-button class="upload-btn" type="primary">
        <div style="display: flex; align-items: center">
          <waves-left theme="outline" size="30" fill="#ffffff"/>
          <div class="btn-text">从音频导入</div>
        </div>
      </el-button>
    </div>

    <div style="display: flex; flex-grow: 1; flex-wrap: wrap; justify-content: center; width: 100%; ">
      <!-- 预览 -->
      <div id="preview">
        <div id="preview-hint-text">
          <div class="rect-before"></div>
          <div>导入预览：</div>
        </div>
        <span id="preview-text">{{ previewText }}</span>
      </div>

      <!-- 选择笔记本和笔记 -->
      <div id="choose-box">
        <div id="choose">
          <div style="display: flex; align-items: center; margin-bottom: 10px">
            <div class="rect-before"></div>
            <div>选择笔记本：</div>
          </div>
          <el-select v-model="selectedNotebook" style="margin-bottom: 20px" placeholder="请选择笔记本">
            <el-option v-for="item in currentNotebooks" :key="item.id" :label="item.name" :value="item">
              <div style="display: flex; align-items: center">
                <notebook-icon class="icon" theme="multi-color" size="18" :fill="['#333' ,'#a5d63f' ,'#FFF']"/>
                <div style="margin-left: 5px; font-size: 16px">{{item.name}}</div>
              </div>
            </el-option>
          </el-select>

          <div style="display: flex; align-items: center; margin-bottom: 10px">
            <div class="rect-before"></div>
            <div>新笔记的名称：</div>
          </div>
          <el-input v-model="newNoteName" style="margin-bottom: 20px"/>
          <el-button type="primary" @click="addNote">确定</el-button>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
  #import-body {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  #option-bar {
    display: flex;
    justify-content: center;
    width: 100%;
    flex-wrap: wrap;
  }

  .upload-btn {
    min-width: 150px;
    width: 20%;
    padding: 35px;
    margin: 20px;
    border-radius: 10px;
    box-shadow: 0 0 3px 3px rgb(220,220,220, 0.5);
  }
  .upload-btn, .upload-btn:focus:not(.upload-btn:hover){
    /*点击后自动失焦*/
    color: var(--el-button-text-color);
    background-color: var(--el-button-bg-color);
    border-color: var(--el-button-border-color);
  }

  .btn-text {
    margin-left: 10px;
    font-size: large;
    font-weight: bolder;
  }

  #preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 50%;
    height: 90%;
    background-color: rgb(250, 250, 250);
    box-shadow: 0 0 5px 5px rgb(128,128,128,0.3);
    min-width: 500px;
    box-sizing: border-box;
    position: relative;
    overflow: scroll;
  }

  #preview-hint-text {
    display: flex;
    align-items: center;
    align-self: start;
    position: sticky;
    z-index: 999;
    width: 100%;
    background-color: rgb(250, 250, 250);
    color: rgb(180,180,180);
    padding: 10px;
    top: 0;
    left: 0;
  }

  #preview-text {
    position: absolute;
    top: 30px;
    left: 50%;
    width: 90%;
    transform: translate(-50%, 0);
    line-height: 40px;
  }

  #choose-box {
    height: 400px;
    width: 300px;
    padding: 50px;
  }

  #choose {
    display: flex;
    flex-direction: column;
    border-radius: 5px;
    border: 1px dashed #a5d63f;
    padding: 20px;
  }

  .rect-before {
    height: 20px;
    width: 5px;
    background-color: #a5d63f;
    margin-right: 5px;
  }
</style>