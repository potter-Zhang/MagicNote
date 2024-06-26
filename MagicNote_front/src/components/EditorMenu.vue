<template>
  <div class="menu_container">
    <div v-for="(item, index) in items">
        <div class="divider" v-if="item.type === 'divider'" :key="`divider${index}`"></div>
        <div v-else>
            <EditorMenuButton :key="index" :icon="item.icon" :title="item.title" :action="item.action" :is-active="item.isActive"/>
        </div>
    </div>

  </div>
    
</template>
  
<script setup lang="ts">
  import { Editor } from '@tiptap/vue-3'
  import EditorMenuButton from './EditorMenuButton.vue'
  
  const props = defineProps<{ editor: Editor }>()
  
  const items = [
    {
      icon: 'text-bold',
      title: 'Bold',
      action: () => props.editor?.chain().focus().toggleBold().run(),
      isActive: () => props.editor?.isActive('bold')
    },
    {
      icon: 'text-italic',
      title: 'Italic',
      action: () => props.editor?.chain().focus().toggleItalic().run(),
      isActive: () => props.editor?.isActive('italic')
    },
    {
      icon: 'strikethrough',
      title: 'Strike',
      action: () => props.editor?.chain().focus().toggleStrike().run(),
      isActive: () => props.editor?.isActive('strike')
    },
    {
      icon: 'code',
      title: 'Code',
      action: () => props.editor?.chain().focus().toggleCode().run(),
      isActive: () => props.editor?.isActive('code')
    },
    {
      type: 'divider'
    },
    {
      icon: 'h1',
      title: 'Heading 1',
      action: () =>
        props.editor?.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => props.editor?.isActive('heading', { level: 1 })
    },
    {
      icon: 'h2',
      title: 'Heading 2',
      action: () =>
        props.editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => props.editor?.isActive('heading', { level: 2 })
    },
    {
      icon: 'h3',
      title: 'Heading 3',
      action: () =>
        props.editor?.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => props.editor?.isActive('heading', { level: 3 })
    },
    {
      icon: 'unordered-list',
      title: 'Bullet List',
      action: () => props.editor?.chain().focus().toggleBulletList().run(),
      isActive: () => props.editor?.isActive('bulletList')
    },
    {
      icon: 'ordered-list',
      title: 'Ordered List',
      action: () => props.editor?.chain().focus().toggleOrderedList().run(),
      isActive: () => props.editor?.isActive('orderedList')
    },
    {
      icon: 'check-list',
      title: 'Task List',
      action: () => props.editor?.chain().focus().toggleTaskList().run(),
      isActive: () => props.editor?.isActive('taskList')
    },
    {
      type: 'divider'
    },
    {
      icon: 'quote',
      title: 'Blockquote',
      action: () => props.editor?.chain().focus().toggleBlockquote().run(),
      isActive: () => props.editor?.isActive('blockquote')
    },
    {
      icon: 'dividing-line',
      title: 'Horizontal Rule',
      action: () => props.editor?.chain().focus().setHorizontalRule().run()
    },
    {
      type: 'divider'
    },
    {
      icon: 'format-clear',
      title: 'Clear Format',
      action: () =>
        props.editor?.chain().focus().clearNodes().unsetAllMarks().run()
    },
    {
      type: 'divider'
    },
    {
      icon: 'back',
      title: 'Undo',
      action: () => props.editor?.chain().focus().undo().run()
    },
    {
      icon: 'next',
      title: 'Redo',
      action: () => props.editor?.chain().focus().redo().run()
    }
  ]
</script>
  
<style scoped>
    .divider {
    background-color: rgba(#fff, 0.25);
    height: 1.25rem;
    margin-left: 0.5rem;
    margin-right: 0.75rem;
    width: 1px;
    display: inline-block;
    }
    .menu_container {
      display: flex;
      flex-direction: row;
      padding: 5px
     
    }
</style>
  
