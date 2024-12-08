<script setup>
  import { ref } from 'vue'
  import CustomInput from '@/components/CustomInput.vue'
  import {loginAPI, loginByEmailAPI, registerAPI, registerByEmailAPI} from "@/api/user";
  import {currentUser} from "@/global";
  import {ElMessage} from "element-plus";

  const buttonText = ref('登录/注册')

  const inputs = ref([
    {
      label: '邮箱地址',
      value: '',
      type: '',
      class: 'login__input'
    },
    {
      label: '密码',
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

  const isEmail = (str) => {
    const pattern = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
    const reg = new RegExp(pattern);
    return reg.test(str);
  }

  const setCurrentUser = (apiResponse) => {
    currentUser.value.id = apiResponse.id;
    currentUser.value.name = apiResponse.name;
    currentUser.value.profile = apiResponse.profile;
    currentUser.value.photo = apiResponse.photo;
    currentUser.value.token = apiResponse.token;
  }

  const loginByUsername = () => {
    import("@/router/index")
        .then(async (module) => {
          const data = {
            "name": inputs.value[0]['value'],
            "password": inputs.value[1]['value']
          };
          loginAPI(data)
              .then((response) => {
                setCurrentUser(response);
                module.default.push("/dashboard");
                ElMessage.success("登录成功");
              })
              .catch((err) => {
                if (err.response.data.error === "用户不存在")
                  register();
                else
                  ElMessage.error(err.response.data.error);
              })
        });
  }

  const loginByEmail = () => {
    import("@/router/index")
        .then(async (module) => {
          const data = {
            "email": inputs.value[0]['value'],
            "password": inputs.value[1]['value']
          };
          loginByEmailAPI(data)
              .then((response) => {
                setCurrentUser(response);
                module.default.push("/dashboard");
                ElMessage.success("登录成功");
              })
              .catch((err) => {
                if (err.response.data.error === "用户不存在")
                  register();
                else
                  ElMessage.error(err.response.data.error);
              })
        });
  }

  const login = () => {
    if (isEmail(inputs.value[0]['value'])) {
      loginByEmail();
    } else {
      loginByUsername();
    }
  }

  const registerByUsername = () => {
    import("@/router/index")
        .then(async (module) => {
          const data = {
            "name": inputs.value[0]['value'],
            "password": inputs.value[1]['value']
          };
          registerAPI(data)
              .then((response) => {
                setCurrentUser(response);
                module.default.push("/dashboard");
                ElMessage.success("注册成功");
              })
              .catch((err) => {
                ElMessage.error(err.response.data.error);
              })
        });
  }

  const registerByEmail = () => {
    import("@/router/index")
        .then(async (module) => {
          const data = {
            "email": inputs.value[0]['value'],
            "name": inputs.value[0]['value'],
            "password": inputs.value[1]['value']
          };
          registerByEmailAPI(data)
              .then((response) => {
                setCurrentUser(response);
                module.default.push("/dashboard");
                ElMessage.success("注册成功");
              })
              .catch((err) => {
                ElMessage.error(err.response.data.error);
              })
        });
  }

  const register = () => {
    if (isEmail(inputs.value[0]['value'])) {
      registerByEmail();
    } else {
      registerByUsername();
    }
  }

</script>

<template>
<body>
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
          <button v-on:click="login" class="button login__submit">
            <span class="button__text">{{ buttonText }}</span>
          </button>
      </form>
      </div>
      <div class="screen__background">
        <span class="screen__background__shape screen__background__shape4"></span>
        <span class="screen__background__shape screen__background__shape3"></span>
        <span class="screen__background__shape screen__background__shape2"></span>
        <span class="screen__background__shape screen__background__shape1"></span>
      </div>
  </div>
</div>
</body>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css?family=Raleway:400,700');

* {
	box-sizing: border-box;
	margin: 0;
	padding: 0;
	font-family: Raleway, sans-serif;
}
body {
	background: linear-gradient(90deg, #c6d4a8, #b3d765);		
}
.container {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
}

.screen {		
	background: linear-gradient(90deg, #A5D63F, #b3ca84);
	position: relative;
	height: 600px;
	width: 360px;	
	box-shadow: 0px 0px 24px #405318;
}

.screen__content {
	z-index: 1;
	position: relative;
	height: 100%;
}

.screen__background {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 0;
	-webkit-clip-path: inset(0 0 0 0);
	clip-path: inset(0 0 0 0);	
}

.screen__background__shape {
	transform: rotate(45deg);
	position: absolute;
}

.screen__background__shape1 {
	height: 520px;
	width: 520px;
	background: #FFF;	
	top: -50px;
	right: 120px;	
	border-radius: 0 72px 0 0;
}

.screen__background__shape2 {
	height: 220px;
	width: 220px;
	background: #90bc31;	
	top: -172px;
	right: 0;	
	border-radius: 32px;
}

.screen__background__shape3 {
	height: 540px;
	width: 190px;
	background: linear-gradient(270deg, #add752, #bbcf8f);
	top: -24px;
	right: 0;	
	border-radius: 32px;
}

.screen__background__shape4 {
	height: 400px;
	width: 200px;
	background: #759431;	
	top: 420px;
	right: 50px;	
	border-radius: 60px;
}

.login {
	width: 320px;
	padding: 30px;
	padding-top: 156px;
}

.login__field {
	padding: 20px 0px;
	position: relative;
}

.login__icon {
	position: absolute;
	top: 30px;
	color: #7875B5;
}

.login__submit {
	background: #fff;
	font-size: 14px;
	margin-top: 30px;
	margin-left: 30px;
	padding: 10px 10px;
	border-radius: 26px;
	border: 1px solid #90cd90;
	text-transform: uppercase;
	font-weight: 700;
	display: flex;
	align-items: center;
	width: 75%;
	color: #A5D63F;
	box-shadow: 0px 2px 2px #50681e;
	cursor: pointer;
	transition: .2s;
}

.login__submit:active,
.login__submit:focus,
.login__submit:hover {
	border-color: #73942e;
	outline: none;
}

.button__icon {
	font-size: 24px;
	margin-left: auto;
	color: #047830;
}

.social-login {
	position: absolute;
	height: 140px;
	width: 160px;
	text-align: center;
	bottom: 0px;
	right: 0px;
	color: #fff;
}

.social-icons {
	display: flex;
	align-items: center;
	justify-content: center;
}

.social-login__icon {
	padding: 20px 10px;
	color: #fff;
	text-decoration: none;
	text-shadow: 0px 0px 8px #7875B5;
}

.social-login__icon:hover {
	transform: scale(1.5);
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

</style>
