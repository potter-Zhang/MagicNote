/*
*
* 用于定义全局变量和全局方法
*
* */


import {ref} from "vue";

export const currentUser = ref({
    id: -1,
    name: "",
    token: "",
    profile: ""
});

export const currentNote = ref({
    noteId: -1,
    notebookId: -1
})
