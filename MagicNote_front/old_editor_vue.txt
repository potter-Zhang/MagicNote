<script setup>
import floatBall from "@/components/FloatBall.vue"
import '@/static/zepto/distrib/zepto.js'
import '@/static/editor.md/editormd.min.js' 
import { onMounted, ref, computed, watch, onBeforeUnmount } from 'vue'
import bubble from '@/components/AIBubble.vue'
import { currentNote, currentUser  } from "../global"
import { globalEventBus } from '@/util/eventBus'

import { getNoteAPI, updateNoteAPI } from '@/api/note.js'
import {ElMessage} from "element-plus";


const noteInEditor = ref({
    notebookId: -1,
    noteId: -1,
    name: ""
})

var editor = null

const imageUploadURL = 'http://localhost:8081/upload/photo'

const showBubble = ref(false)

const selectedText = ref('')

const func = ref('')

function reset() {
  showBubble.value = false
}

function insert(content) {
    if (editor) {
        editor.replaceSelection(editor.getSelection() + content)
    }
}

function saveNote() {
  console.log('saveNote')
    var note = noteInEditor.value
    note.content = editor.getMarkdown()
    updateNoteAPI(note)
        .catch((err) => console.log(err))
}

function replace(content) {
    if (editor) {
        editor.replaceSelection(content)
    }
}

function setBubble(AIFunction, select) {
  const floatBall = document.getElementById("ball");
  const bubble = document.getElementById("bubble");
  const ballTop = floatBall.offsetTop;
  const ballLeft = floatBall.offsetLeft;
  // 让ai-bubble出现在float-ball左上方
  bubble.style.top = ballTop + "px";
  bubble.style.left = ballLeft + "px";
  func.value = AIFunction
  selectedText.value = select
  showBubble.value = true
  // 通知ai对话框关闭
  globalEventBus.emit("AIBubbleOpen");
}

watch(() => currentNote.value.noteId, (note, prevNote) => {
    console.log(note)
    if (prevNote > 0 && note === -1) {
      editor.clear()
      noteInEditor.value = { notebookId: -1, noteId: -1, name: ""}
      return
    }
      
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
      htmlDecode : true,
      imageUpload : true,
      imageFormats : ["jpg", "jpeg", "gif", "png", "bmp", "webp"],
      width  : "100%",
      height : "700px",
      path   : "./editor.md/lib/",
      toolbarIcons : function() {
        return ["save", "|", "undo", "redo", "|", "abstract", "expand", "segment", "generateTable", "generateFlowChart", "|",
            "bold", "del", "italic", "quote", "ucwords", "uppercase", "lowercase", "|", 
            "h1", "h2", "h3", "h4", "h5", "h6", "|", 
            "list-ul", "list-ol", "hr", "|",
            "link", "reference-link", "image", "code", "preformatted-text", "code-block", "table", "datetime", "emoji", "pagebreak", "|",
            "watch", "preview", "fullscreen", "clear", "search"]
      },
      onload : function() {
                var keyMap = {
                  "Ctrl-S": function(cm) {
                    if (noteInEditor.value.noteId !== -1) {
                      saveNote()
                      ElMessage.success('保存成功')
                    }
                  }
                }
                this.addKeyMap(keyMap)
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
      crossDomainUpload: true,
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
            getImageUploadURL: function() {
              return imageUploadURL + '/' + currentUser.value.id + '/' + currentNote.value.noteId
            },
            saveImage: function() {
              saveNote()
            }
            ,
            save: function(cm, icon, cursor, selection) {
                
                var note = noteInEditor.value
                if (note.noteId === -1) {
                  ElMessage.error("请先打开一篇笔记")
                  return;
                }
                console.log(note)
                note.content = this.getMarkdown()
                
                updateNoteAPI(note)
                    .then(() => {
                      ElMessage.success("保存成功")
                      globalEventBus.emit('SyncDialog')
                    })
                    .catch((err) => console.log(err))
            }
          },
      emoji: true,
      tex : true
      });

      globalEventBus.on('SyncNote', () => {
        saveNote()
      })
  
	});


onBeforeUnmount(() => {
  globalEventBus.all.clear()
  if (noteInEditor.value.noteId !== -1) {
    saveNote()
  }
})

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

</script>

<template>
  <component :is="'script'" src="./editor.md/jquery-1.12.0/package/distrib/jquery.min.js"></component>
  <link rel="stylesheet" href="./editor.md/css/editormd.min.css" />
  <div id="editor-container">
    <div id="currentEditing">正在编辑：{{currentNote.name}} </div>
    <div id="editor">

    </div>
    <bubble @insert="insert" @replace="replace" @close="reset" @function-done="func=''"
            v-show="showBubble" :text="selectedText" :func="func"></bubble>
    <float-ball @synEditor="saveNote"/>
  </div>
</template>

<style>
  #editor {
    height: 100% !important;
    width: 100% !important;
    margin: 0;
    box-sizing: border-box;
    border: 0;
  }
  .editormd-preview {
    width: 50% !important;
  }
  .editormd .CodeMirror {
    width: 50% !important;
  }

</style>

<style scoped>
  #editor-container {
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  #currentEditing {
    color: rgb(128, 128, 128);
    margin: 5px;
  }
</style>