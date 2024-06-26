<script setup>
import floatBall from "@/components/FloatBall.vue"
import '@/static/zepto/distrib/zepto.js'
import '@/static/editor.md/editormd.min.js' 
import bubble from '@/components/AIBubble.vue'
import { currentNote, currentUser  } from "../global"
import { globalEventBus } from '@/util/eventBus'

import { getNoteAPI, updateNoteAPI } from '@/api/note.js'
import {ElMessage} from "element-plus";
import StarterKit from '@tiptap/starter-kit';
import { defineComponent, onMounted, onBeforeUnmount, ref,watch } from 'vue';

import { Editor, EditorContent, useEditor, BubbleMenu  } from '@tiptap/vue-3';
// import { storeToRefs } from 'pinia'
// import Underline from '@tiptap/extension-underline'

// 列表
import ListItem from '@tiptap/extension-list-item'
import OrderedList from '@tiptap/extension-ordered-list'
import BulletList from '@tiptap/extension-bullet-list'
// 代码
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import css from 'highlight.js/lib/languages/css'
import js from 'highlight.js/lib/languages/javascript'
import ts from 'highlight.js/lib/languages/typescript'
import html from 'highlight.js/lib/languages/xml'
import { common, createLowlight } from 'lowlight'
const lowlight = createLowlight()
lowlight.register({ html, ts, css, js })
// 字数统计
import Placeholder from '@tiptap/extension-placeholder'
// import { UndoRound, MoreHorizOutlined } from '@vicons/material'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import EditorMenu from "./EditorMenu.vue"

// 


const noteInEditor = ref({
    notebookId: -1,
    noteId: -1,
    name: ""
})

const editor = useEditor({
        content: ``,
        extensions: [
          StarterKit,
          TaskList,
          TaskItem,
          Placeholder.configure({
            placeholder: '开始输入文本 …'
          }),
          OrderedList,
          BulletList,
          ListItem,
        ],
        injectCSS: false
      })

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
  // editor = new Editor({
  //       content: '<p>欢迎使用Tiptap!🎉</p>',
  //       extensions: [StarterKit],
  //     });
      globalEventBus.on('SyncNote', () => {
        saveNote()
      })
  
	});


onBeforeUnmount(() => {
  globalEventBus.all.clear()
  if (noteInEditor.value.noteId !== -1) {
    saveNote()
  }
  //editor?.destroy();
})

</script>

<template>
  <div class="EditMain">
    <div class="editor">
      <div class="editorcard">
        
        <div class="toptools">
          <EditorMenu :editor="editor" />
        </div>
        <div class="editcont">
          <EditorContent
            style="padding: 8px;  overflow-y: auto;"
            :editor="editor"
            />
        </div>
        <div class="bottomcount"></div>
      </div>
    </div>
  </div>

</template>

<style>
  /* #editor {
    height: 100% !important;
    width: 100% !important;
    margin: 0;
    box-sizing: border-box;
    border: 0;
  } */

</style>

<style scoped>
.EditMain{
    position: relative;
    width:100%;
    height: 100%;

    display: grid;
    grid-template-columns: 100%;
  
  }
 

  .editorcard{
    position: relative;
    width:95%;
    height: 95%;
    left: 2.5%;
    top:2.5%;
    display: grid;
    grid-template-rows: 5% 92% 3%;
    border: 1px solid #4f5c5765;
  }
  .editorcard .editor{
    position: relative;
    width:100%;
    height: 100%;
    left: 0;
    top:0;
    display: grid;
    grid-template-rows: 10% 90%;
  }
  .editorcard .editor{
    position: relative;
    width:100%;
    height: 100%;
    left: 0;
    top:0;
    display: grid;
    grid-template-rows: 10% 90%;
  }
  .toptools{
    background-color: rgba(207, 220, 245, 0.199);
    border-bottom: 1px dashed #9ca19f65;
    
  }
  .bottomcount{
    background-color: rgba(207, 220, 245, 0.199);
    border-top: 1px dashed #9ca19f65;
    height: 100%;
    width: 100%;
    display: grid;
    grid-template-columns: 100%;
    grid-template-rows: 100%;
    justify-items: center;
    align-items: center;
  }
  .editcont{
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  </style>
  
  <style lang="scss">
  b {
    font-weight: bold;
  }
  .ProseMirror {
    overflow-y: scroll;
  }
  .ProseMirror p {
    margin: 0;
  }
  .ProseMirror:focus {
    outline: none;
  }
  .tiptap p.is-editor-empty:first-child::before {
    color: #adb5bd;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
  
  .tiptap {
    > * + * {
      margin-top: 0.75em;
    }
  
    ul {
      padding: 0 2rem;
      list-style: square;
    }
    ol {
      padding: 0 2rem;
      list-style: decimal;
    }
    table {
      border-collapse: collapse;
      table-layout: fixed;
      width: 100%;
      margin: 0;
      overflow: hidden;
  
      td,
      th {
        min-width: 1em;
        border: 2px solid #ced4da;
        padding: 3px 5px;
        vertical-align: top;
        box-sizing: border-box;
        position: relative;
  
        > * {
          margin-bottom: 0;
        }
      }
  
      th {
        font-weight: bold;
        text-align: left;
        background-color: #f1f3f5;
      }
  
      .selectedCell:after {
        z-index: 2;
        position: absolute;
        content: '';
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        background: rgba(200, 200, 255, 0.4);
        pointer-events: none;
      }
  
      .column-resize-handle {
        position: absolute;
        right: -2px;
        top: 0;
        bottom: -2px;
        width: 4px;
        background-color: #adf;
        pointer-events: none;
      }
  
      p {
        margin: 0;
      }
    }
    pre {
      background: #0d0d0d;
      color: #fff;
      font-family: 'JetBrainsMono', monospace;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
  
      code {
        color: inherit;
        padding: 0;
        background: none;
        font-size: 0.8rem;
      }
  
      .hljs-comment,
      .hljs-quote {
        color: #616161;
      }
  
      .hljs-variable,
      .hljs-template-variable,
      .hljs-attribute,
      .hljs-tag,
      .hljs-name,
      .hljs-regexp,
      .hljs-link,
      .hljs-name,
      .hljs-selector-id,
      .hljs-selector-class {
        color: #f98181;
      }
      .hljs-number,
      .hljs-meta,
      .hljs-built_in,
      .hljs-builtin-name,
      .hljs-literal,
      .hljs-type,
      .hljs-params {
        color: #fbbc88;
      }
  
      .hljs-string,
      .hljs-symbol,
      .hljs-bullet {
        color: #b9f18d;
      }
  
      .hljs-title,
      .hljs-section {
        color: #faf594;
      }
  
      .hljs-keyword,
      .hljs-selector-tag {
        color: #70cff8;
      }
  
      .hljs-emphasis {
        font-style: italic;
      }
  
      .hljs-strong {
        font-weight: 700;
      }
    }
  }
  
  .tableWrapper {
    overflow-x: auto;
  }
  
  .resize-cursor {
    cursor: ew-resize;
    cursor: col-resize;
  }

</style>