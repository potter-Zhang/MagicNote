<script setup>
  import notebookIcon from "@icon-park/vue-next/lib/icons/Notebook"

  import upload from "@icon-park/vue-next/lib/icons/Upload"

  import {ref, onMounted} from "vue";

  import {currentNotebooks, currentUser} from "@/global";

  import '@/static/zepto/distrib/zepto.js'
  import '@/static/editor.md/editormd.min.js'
  import {ElMessage} from "element-plus";
  import {addNoteAPI} from "@/api/note";
  import { transformPdfAPI, transformPptAPI  } from "@/api/ocr";
  import { transformAudioVideoAPI } from "@/api/transcribe";

  const reader = new FileReader()

  const fileName = ref('')

  const uploading = ref(false)

  onMounted(() => {
    var fileUploader = document.getElementById('file-uploader')
    fileUploader.addEventListener('change', (event) => {
      if (event.target.files.length === 0)
        return
      const file = event.target.files[0]
      console.log(file.type)
      fileName.value = file.name
      const formData = new FormData()
      formData.append('file', file)
      uploading.value = true
      if (file.type === 'application/pdf') {
        transformPdfAPI(formData).then((msg) => {previewText.value = extractPDFMeta(msg)}).catch((err) => ElMessage.error(err.response)).finally(() => uploading.value = false)
      }
      else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        transformPptAPI(formData).then((msg) => {previewText.value = msg}).catch((err) => ElMessage.error(err.response)).finally(() => uploading.value = false)
      }
      else if (file.type.startsWith('audio') || file.type.startsWith('video')) {
        transformAudioVideoAPI(formData).then((msg) => {previewText.value = msg}).catch((err) => ElMessage(err.response)).finally(() => uploading.value = false)
      }
      else {
        uploading.value = false
        ElMessage.error('文件类型不支持')
      }
      
      
    })

    
    
  })

  function extractPDFMeta(msg) {
    for (let i = 0; i < msg.length; i++) {
      if (msg[i] === '\n') {
        console.log(i)
        ElMessage.success(msg.substring(0, i))
        console.log(msg.substring(i))
        return msg.substring(i)
      }
    }
    return msg
  }

  const previewText = ref('')

  const selectedNotebook = ref("");
  const newNoteName = ref("");

  const addNote = () => {
    const notebook = selectedNotebook.value;
    if (uploading.value) {
      ElMessage("请等待上传完成！")
      return
    }
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
        .finally(() => {
          selectedNotebook.value = ""
          newNoteName.value = ""
          previewText.value = ""
        })
  }
</script>

<template>
  <div id="import-body">
    <div style="display: flex; flex-grow: 1; flex-wrap: wrap; justify-content: center; width: 100%; ">
      <!-- 预览 -->
      <div id="preview" v-loading="uploading">
        <div id="preview-hint-text">
          <div class="rect-before"></div>
          <div>导入预览：</div>
        </div>
        <span id="preview-text" placeholder="导入你的笔记吧~">{{ previewText }}</span>
      </div>

      <!-- 选择笔记本和笔记 -->
      <div id="choose-box">
        <div class="upload-area">
          <el-button class="upload-btn" type="primary">
            <div style="display: flex; align-items: center">
              <upload theme="outline" size="30" fill="#ffffff"/>
              <div class="btn-text">导入</div>
              <input type="file" id="file-uploader" accept=".pdf, .pptx, image/*, video/*">
            </div>
          </el-button>
          <el-input type="textarea" resize="none" rows="1" :readonly="true" v-model="fileName"></el-input>
          <div class="file-type-prompt"> 
            <label>支持pdf, ppt, 视频和音频导入</label>
          </div>
        </div>
        <div id="choose">
          <div style="display: flex; align-items: center; margin-bottom: 10px">
            <div class="rect-before"></div>
            <div>选择笔记本：</div>
          </div>
          <el-select v-model="selectedNotebook" value-key="id" style="margin-bottom: 20px" placeholder="请选择笔记本">
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
          <el-button type="primary" @click="addNote">创建新笔记</el-button>
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

  #file-uploader, #file-uploader-pdf, #file-uploader-ppt {
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .file-name {
    resize: none;
  }

  .upload-btn {
    min-width: 150px;
    width: 90%;
    aspect-ratio: 3;
    padding: 35px;
    margin: 13px;
    border-radius: 10px;
    box-shadow: 0 0 3px 3px rgb(220,220,220, 0.5);
    position: relative;
  }
  .upload-btn, .upload-btn:focus:not(.upload-btn:hover){
    /*点击后自动失焦*/
    color: var(--el-button-text-color);
    background-color: var(--el-button-bg-color);
    border-color: var(--el-button-border-color);
  }

  .upload-area {
    display: flex;
    flex-direction: column;
    border-radius: 5px;
    border: 1px dashed #a5d63f;
    padding: 20px;
    margin-top: 10%;
    margin-bottom: 20%;
  }

  .file-type-prompt {
    font-size: small;
    margin-top: 1%;
    justify-content: center;
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
    height: 80%;
    background-color: rgb(250, 250, 250);
    box-shadow: 0 0 5px 5px rgb(128,128,128,0.3);
    min-width: 500px;
    box-sizing: border-box;
    position: relative;
    margin-top: 5%;
    overflow: scroll;
  }
  #preview::-webkit-scrollbar {
    display: none;
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