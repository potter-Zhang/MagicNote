<script setup>
  import {onMounted} from "vue";
  import {currentUser} from "@/global";

  onMounted(() => {
    if (sessionStorage.getItem('currentUser')) {
      const store = JSON.parse(sessionStorage.getItem('currentUser'));
      currentUser.value.id = store['id'];
      currentUser.value.name = store['name'];
      currentUser.value.token = store['token'];
      currentUser.value.profile = store['profile'];
      currentUser.value.photo = store['photo'];
    }

    // 在页面刷新时保存用户信息
    window.addEventListener('beforeunload', () => {
      sessionStorage.setItem('currentUser', JSON.stringify(currentUser.value));
    });
  })
</script>

<template>
  <router-view></router-view>
</template>

