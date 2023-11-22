<script setup>
import { ref } from 'vue'
import CustomInput from '@/components/CustomInput.vue'
import '../assets/LoginPage.css'

const status = ref('sign up')
const prompt = ref('not registed yet?')
const buttonText = ref('Log In')

const inputs = ref([
  {
    label: 'Your Email',
    value: '',
    type: 'email',
    class: 'login__input'
  },
  {
    label: 'Your Password',
    value: '',
    type: 'password',
    class: 'login__input'
  }
])

const toggle = function () {
  console.log(inputs.value[0].value, inputs.value[1].value)
}

const addInput = function () {
  inputs.value.push({
    label: 'Your Code',
    value: '',
    type: 'text',
    class: 'login__input'
  })
}

const removeInput = function () {
  inputs.value.pop()
}

const change = function () {
  if (status.value === 'sign up') {
    status.value = 'log in'
    prompt.value = 'already had an account?'
    buttonText.value = 'Sign Up'
    addInput()
  } else {
    status.value = 'sign up'
    prompt.value = 'not registered yet?'
    buttonText.value = 'Log In'
    removeInput()
  }
}

</script>

<template>
<div class="container">
  <div class="screen">
    <div class="screen__content">
      <form class="login" v-on:submit.prevent>
          <CustomInput v-for="(input, idx) in inputs"
              :key="idx"
              :label="input.label"
              :type="input.type"
              v-model="input.value"
              />
          <button v-on:click="toggle" class="button login__submit">
            <span class="button__text">{{ buttonText }}</span>
            <i class="button__icon fas fa-chevron-right"></i>
          </button>
      </form>
      <div>
        <span>{{ prompt }} <router-link to="/login" v-on:click="change">{{ status }}</router-link> now!</span>
      </div>
      </div>
      <div class="screen__background">
        <span class="screen__background__shape screen__background__shape4"></span>
        <span class="screen__background__shape screen__background__shape3"></span>
        <span class="screen__background__shape screen__background__shape2"></span>
        <span class="screen__background__shape screen__background__shape1"></span>
      </div>
  </div>
</div>
</template>
