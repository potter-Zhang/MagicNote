<script setup>
import floatBall from "@/components/FloatBall.vue"
import '@/static/zepto/distrib/zepto.js'
import '@/static/editor.md/editormd.min.js' 
import { onMounted, ref, computed, watch } from 'vue'
import bubble from '@/components/AIBubble.vue'
import { currentNote  } from "../global"
import { getNoteAPI, updateNoteAPI } from '@/api/note.js'
import {ElMessage} from "element-plus";


const noteInEditor = ref({
    notebookId: -1,
    noteId: -1,
    name: ""
})

var editor = null

const flip = ref(false)
const showBubble = ref(false)

const selectedText = ref('')

const x = ref(111)

const y = ref(Math.round(window.innerWidth / 2))

const width = ref(0)

const height = ref(0)

const func = ref('')

function reset() {
  showBubble.value = false
}

function insert(content) {
    if (editor) {
        editor.replaceSelection(editor.getSelection() + content)
    }
}

function replace(content) {
    if (editor) {
        editor.replaceSelection(content)
    }
}

function setBubble(AIFunction, select) {
  const editorPanel = document.getElementById('editor');
  const rect = editorPanel.getBoundingClientRect()
  x.value = Math.round(rect.top + rect.height / 2)
  y.value = Math.round(rect.left + rect.width / 2)
  func.value = AIFunction
  width.value = Math.round(rect.width / 2)
  height.value = Math.round(rect.height / 2)
  selectedText.value = select
  showBubble.value = true
}

watch(() => currentNote.value.noteId, (note, prevNote) => {
    console.log(note)
    if (note === -1)
        return
    if (noteInEditor.value.noteId !== -1) {
        noteInEditor.value.content = editor.getMarkdown()
        updateNoteAPI(noteInEditor.value).then().catch((err) => console.log(err))
    }
    getNoteAPI(note)
    .then((note) => {
        if (editor) {
            editor.setMarkdown(note.content)
            noteInEditor.value = note
        }
    })
    .catch((err) => console.log(err))
},
{
    immediate: true
})

onMounted(() => {
    console.log('init')
    const editormd = require('@/static/editor.md/editormd')
   
    editor = editormd("editor", {
      
      imageUpload : true,
      imageFormats : ["jpg", "jpeg", "gif", "png", "bmp", "webp"],
      imageUploadURL : "/upload/photo", //图片上传路径
      width  : "100%",
      height : "700px",
      path   : "./editor.md/lib/",
      toolbarIcons : function() {
        return ["save", "|", "undo", "redo", "|", "abstract", "expand", "segment", "generateTable", "generateFlowChart", "|",
            "bold", "del", "italic", "quote", "ucwords", "uppercase", "lowercase", "|", 
            "h1", "h2", "h3", "h4", "h5", "h6", "|", 
            "list-ul", "list-ol", "hr", "|",
            "link", "reference-link", "image", "code", "preformatted-text", "code-block", "table", "datetime", "emoji", "html-entities", "pagebreak", "|",
            "watch", "preview", "fullscreen", "clear", "search"]
      },
    
      
      toolbarIconsClass : {
            // abstract : "far fa-file",  // 指定一个FontAawsome的图标类
            // expand : "fal fa-edit",
            // segment : "fal fa-align-justify",
            // generateTable : "fal fa-table",
            // generateFlowChart : "fa fa-connectdevelop",
            // save : "fa-save"
      },
      onload : function() {
                console.log('onload', this);
                mermaid.init();
                initGraph();
                if (currentNote.value.noteId !== -1) {
                    getNoteAPI(currentNote.value.noteId)
                    .then((note) => { 
                        this.setMarkdown(note.content.toString())
                        noteInEditor.value = note
                    })
                    .catch((err) => console.log(err))
                }
    },
      onchange : function() {
          initGraph();
          mermaid.init();
      },
      toolbarIconTexts : {
          abstract : "<div style=\"display: flex; flex-direction: column\"><div class=\"far fa-file\"></div><span style=\"font-size: small\">abstract</span></div>",  // 如果没有图标，则可以这样直接插入内容，可以是字符串或HTML标签
          expand : "<div style=\"display: flex; flex-direction: column\"><div class=\"fal fa-edit\"></div><span style=\"font-size: small\">expand</span></div>",
          segment : "<div style=\"display: flex; flex-direction: column\"><div class=\"fal fa-align-justify\"></div><span style=\"font-size: small\">segment</span></div>",
          generateTable : "<div style=\"display: flex; flex-direction: column\"><div class=\"fal fa-table\"></div><span style=\"font-size: small\">table</span></div>",
          generateFlowChart : "<div style=\"display: flex; flex-direction: column\"><div class=\"fa fa-connectdevelop\"></div><span style=\"font-size: small\">flow chart</span></div>",
          save : "<div style=\"display: flex; flex-direction: column\"><div class=\"fa-save\"></div><span style=\"font-size: small\">save</span></div>"
      },
      lang : {
            toolbar : {
                abstract : "摘要",  // 如果没有图标，则可以这样直接插入内容，可以是字符串或HTML标签
                expand : "扩写",
                segment : "分段",
                generateTable : "表格生成",
                generateFlowChart : "思维导图生成",
                save : "保存"
            }
        },
      extensions: ["mermaid"],
      mermaid: {
          startOnLoad: true,
          theme: "default",
          htmlLabels: false
      },
      toolbarHandlers : {
            /**
             * @param {Object}      cm         CodeMirror对象
             * @param {Object}      icon       图标按钮jQuery元素对象
             * @param {Object}      cursor     CodeMirror的光标对象，可获取光标所在行和位置
             * @param {String}      selection  编辑器选中的文本
             */
            abstract : function(cm, icon, cursor, selection) {
                if(selection === "") {
                    cm.setCursor(cursor.line, cursor.ch + 1);
                } else {
                    console.log(selection)
                    setBubble('abstract', selection)
                }
            },
            expand: function(cm, icon, cursor, selection) {
              if(selection === "") {
                  cm.setCursor(cursor.line, cursor.ch + 1);
              } else {
                  setBubble('expand', selection)
              }
            },
            segment: function(cm, icon, cursor, selection) {
              if(selection === "") {
                  cm.setCursor(cursor.line, cursor.ch + 1);
              } else {
                  setBubble('segment', selection)
              }
            },
            generateTable: function(cm, icon, cursor, selection) {
              if(selection === "") {
                  cm.setCursor(cursor.line, cursor.ch + 1);
              } else {
                  setBubble('generateTable', selection)
              }
            },
            generateFlowChart: function(cm, icon, cursor, selection) {
              if(selection === "") {
                  cm.setCursor(cursor.line, cursor.ch + 1);
              } else {
                  setBubble('generateFlowChart', selection)
              }
            },
            save: function(cm, icon, cursor, selection) {
                
                var note = noteInEditor.value
                console.log(note)
                note.content = this.getMarkdown()
                
                updateNoteAPI(note)
                    .then(() => {
                      ElMessage.success("保存成功")
                    })
                    .catch((err) => console.log(err))
            }


          },
      emoji: true
      });
  
	});

const mermaidHtml = (str) => {
      return `<pre><code class="language-mermaid"><div class="mermaid">${str}</div></code></pre>`
}
const initGraph = () => {
    $('.editormd-preview-container').find('pre').find('ol').find('.L0').find('.lang-mermaid').each(function() {
        var buffer = new Array();
        $(this).parent().parent().find('li').each(function() {
            $(this).find('span').each(function() {
                buffer.push($(this).text());
            })
            buffer.push("\n");
        })

        var preDom = $(this).parent().parent().parent();
        var contentBuffer = buffer.join("");
        var content = mermaidHtml(contentBuffer);
        console.log(content);
        $(content).insertAfter(preDom);
        $(preDom).remove();
    })
}

function initMarkdown() {
    
}

</script>

<template>
  <component :is="'script'" src="./editor.md/jquery-1.12.0/package/distrib/jquery.min.js"></component>
  <link rel="stylesheet" href="./editor.md/css/editormd.min.css" />
  <div id="editor">
    <bubble @insert="insert" @replace="replace" @close="reset" v-if="showBubble" :text="selectedText" :x="x" :y="y" :width="width" :height="height" :func="func"></bubble>
  </div>
  <float-ball/>
</template>

<style>
  #editor {
    height: 100% !important;
    width: 100% !important;
    margin: 0;
    box-sizing: border-box;
  }
  .editormd-preview {
    width: 50% !important;
  }
  .editormd .CodeMirror {
    width: 50% !important;
  }

</style>

<style scoped>
</style>