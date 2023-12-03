/*
*
* 用于定义全局变量和全局方法
*
* */


import {ref, onBeforeMount} from "vue";
import {getNotebooksAPI} from "@/api/notebook";

export const currentUser = ref({
    id: -1,
    name: "",
    token: "",
    photo: "",
    profile: ""
});

export const currentNote = ref({
    noteId: -1,
    name: "",
    notebookId: -1,
    updateCode: -1
})

export const setCurrentNote = (noteid, name, notebookid) => {
    currentNote.value.noteId = noteid;
    currentNote.value.name = name;
    currentNote.value.notebookId = notebookid
}

export const currentNotebooks = ref([])

export const updateNotebooks = async () => {
    const response = await getNotebooksAPI(currentUser.value.id);
    currentNotebooks.value.splice(0, currentNotebooks.value.length, ...response);
}
