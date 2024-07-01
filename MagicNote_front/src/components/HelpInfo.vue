<script setup>
import right from "@icon-park/vue-next/lib/icons/Right";
import arrowCircleLeft from "@icon-park/vue-next/lib/icons/ArrowCircleLeft";

import {ref} from "vue";

const catalogVisible = ref(true);
</script>

<template>
  <div id="container">
    <arrow-circle-left id="openBtn" @click="catalogVisible=true" v-show="!catalogVisible" class="icon" theme="outline" size="30" fill="#8fefdd"/>
    <div id="catalog" v-show="catalogVisible">
      <div id="catalog-header">
        <div>目录</div>
        <right class="icon" @click="catalogVisible=false" style="margin-right: 10px" theme="outline" size="30" fill="#ffffff"/>
      </div>
      <a class="catalog-link" href="#paragraph1">
        <div class="catalog-item">一、文本编辑</div>
      </a>
      <a class="catalog-link" href="#paragraph2">
        <div class="catalog-item">二、AI辅助</div>
      </a>
      <a class="catalog-link" href="#paragraph3">
        <div class="catalog-item">三、导入笔记</div>
      </a>
      <a class="catalog-link" href="#paragraph4">
        <div class="catalog-item">四、鸣谢</div>
      </a>
    </div>

    <div id="main-body">
      <h1>
        <div style="display: flex; align-items: center">
          <img src="/inote.ico" height="36" width="36" style="margin-right: 15px">
          <div>玩转MagicNote</div>
        </div>
      </h1>
      <p>
        欢迎来到MagicNote! MagicNote是一个致力于笔记编辑的工具，我们希望每个人都可以方便快捷地记录、保存自己的笔记，为此，我们接入了当下流行的语言大模型，
        通过其强大的功能助力您的写作。
      </p>

      <h2 id="paragraph1">一、文本编辑</h2>
      <p style="margin-bottom: 20px">MagicNote以笔记本-笔记的形式来组织您的文档，在创建笔记之前您需要先创建一个笔记本，笔记本是笔记的集合，这样的组织方式有助于您分类归档笔记。</p>
      <p>在创建了您的笔记之后，您可以在编辑器中对其进行编辑，MagicNote的编辑器提供了最基本的文本编辑功能，您可以通过编辑器上方的工具栏来插入各种格式的内容：</p>
      <img src="/help/toolbar.png" class="img-in-text">
      <p>
        包括但不限于：<b>粗体</b>、<em>斜体</em>、<s>删除线</s>和图片。
        <b>除此之外，MagicNote还支持插入链接、有序和无序列表、代码块、数学公式、表格和流程图，您的笔记可以有多种多样的呈现方式。</b>
      </p>
      <p style="margin-top: 20px">
        MagicNote还支持以MarkDown语法来插入以上格式的内容，我们的编辑器分为左右两个部分，左边用于编辑您的笔记内容，而右边则会对MarkDown进行实时渲染：
      </p>
      <img src="/help/editor.png" class="img-in-text">

      <h2 id="paragraph2">二、AI辅助</h2>
      <p>MagicNote的magic之处在于其不仅仅是一个文本编辑器与文本管理器，🤖AI️大模型的存在使得您能够更轻松地编辑您的笔记，目前我们提供的功能有：</p>
      <ul style="margin-top: 0; line-height: 28px">
        <li>文本摘要</li>
        <li>扩写文本</li>
        <li>文本分段</li>
        <li>生成表格</li>
        <li>生成流程图</li>
      </ul>
      <p>
        要使用这些功能，您需要在文本编辑区中先选择一段文本，然后点击编辑器工具栏中的abstract、expand、segment、table、flow chart按钮，生成结果
        会在悬浮球的上方显示，您可以选择使用生成的文本来替换选中的文本或者是插入到原文本后：
      </p>
      <img src="/help/AIFunction.png" class="img-in-text">
      <p>除了这些固定的内容之外，您还可以根据当前正在编辑的笔记内容来和AI进行对话，您可以点击复制图标复制回答内容；如果弹窗阻碍了视野，您也可以拖动悬浮球来移动弹窗：</p>
      <img src="/help/AIDialog.png" class="img-in-text">

      <h2 id="paragraph3">三、导入笔记</h2>
      <p>最方便的记笔记方式就是什么都不用记，MagicNote可以负责将您的pdf、ppt、视频和音频转换成文字，在完成导入后您可以在左边的预览框中查看转化结果，导入的过程需要一定的时间。</p>
      <img src="/help/import.png" class="img-in-text">
      <p>在导入完成后，您可以在右下方选择一个笔记本并提供新笔记的名称，点击“创建新笔记”按钮后MagicNote会将导入结果创建到新的笔记当中。</p>

      <h2 id="paragraph4">四、鸣谢</h2>
      <div style="display: flex; align-items: center; margin-bottom: 20px">
        <a href="https://pandao.github.io/editor.md/">Editor.md</a><span>：开源在线Markdown编辑器</span>
      </div>
      <div style="display: flex; align-items: center; margin-bottom: 20px">
        <a href="https://element-plus.org/zh-CN/">Element Plus</a><span>：一个Vue3 UI框架</span>
      </div>
      <div style="display: flex; align-items: center">
        <a href="http://iconpark.oceanengine.com/home">IconPark</a><span>：一个开源图标库</span>
      </div>
      <br/>
    </div>
  </div>


</template>

<style scoped>
  #container {
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    display: flex;
    flex-direction: row-reverse;
    justify-content: center;
  }

  #openBtn {
    position: sticky;
    top: 100px;
    height: 30px;
  }

  #catalog {
    position: sticky;
    top: 100px;
    right: 20px;
    height: 210px;
    width: 250px;
    background-color: white;
    border-radius: 5px;
    box-shadow: 2px 2px 2px 2px rgb(200,200,200,0.5);
    overflow: hidden;
  }

  #catalog-header {
    background-color: #8fefdd;
    color: white;
    font-size: 24px;
    width: 100%;
    padding: 5px;
    margin-bottom: 10px;
    box-shadow: 0 1px 1px 1px rgb(200,200,200,0.5);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .catalog-item {
    padding: 6px 0 6px 10px;
  }
  .catalog-item:hover {
    color: black;
    background-color: rgb(250,250,250);
  }

  .catalog-link {
    text-decoration: none;
    color: rgb(128, 128, 128);
  }

  #main-body {
    display: flex;
    flex-direction: column;
    width: 95%;
    padding-left: 5%;
    padding-right: 5%;
    box-sizing: border-box;
    margin-bottom: 50px;
  }

  .img-in-text {
    max-width: 80%;
    align-self: center;
    margin-top: 10px;
    margin-bottom: 10px;
  }

  h1 {
    font-size: 36px;
    margin-bottom: 24px;
  }

  p {
    margin: 0;
    line-height: 28px;
  }
</style>
