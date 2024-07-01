<script setup>
  import { ref, onMounted } from 'vue'
  import CustomInput from '@/components/CustomInput.vue'
  import {loginAPI, loginByEmailAPI, registerAPI, registerByEmailAPI} from "@/api/user";
  import {currentUser} from "@/global";
  import {ElMessage} from "element-plus";
  import {
    Check,
    Delete,
    Edit,
    Message,
    Search,
    Star,
  } from '@element-plus/icons-vue'
  const buttonText = ref('登录/注册')

  const rememberPassword = ref(false);
  const autoLogin = ref(false);

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

  onMounted(() => {
    loadCredentials();
    if (autoLogin.value) {
      login();
    }
  });

  const loadCredentials = () => {
    const savedUsername = localStorage.getItem('username');
    const savedPassword = localStorage.getItem('password');
    const savedAutoLogin = localStorage.getItem('autoLogin');

    if (savedUsername) {
      inputs.value[0]['value'] = savedUsername;
      rememberPassword.value = true;
    }

    if (savedPassword) {
      inputs.value[1]['value'] = savedPassword;
    }

    if (savedAutoLogin) {
      autoLogin.value = true;
    }
  };

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
              // for debugging
              // .finally(() => {
              //   module.default.push("/dashboard");
              // })
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

    if (rememberPassword.value||autoLogin.value) {
      localStorage.setItem('username', inputs.value[0]['value']);
      localStorage.setItem('password', inputs.value[1]['value']);
    } else {
      localStorage.removeItem('username');
      localStorage.removeItem('password');
    }

    if (autoLogin.value) {
      localStorage.setItem('autoLogin', true);
    } else {
      localStorage.removeItem('autoLogin');
    }

    // 登录成功后重置表单状态
    if (!autoLogin.value) {
      rememberPassword.value = false;
      password.value = '';
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

  const loginOrRegister = () => {

  }

</script>

<template>
<body>
<div class="container">
  <div class="screen">
    <div class="screen__content">
      <div style="display: flex; align-items: center; margin: 20px 20px 20px 20px">
        <img src="/inote.ico" height="50" width="50" style="margin-right: 15px">
        <div style="font-style: italic;font-weight: bold;font-size: 30px">MagicNote</div>
      </div>
      <div>
        <div class="wave-line-css"></div>
      </div>
      <form class="login" v-on:submit.prevent>
        <el-input
            v-for="(input, idx) in inputs"
            :key="idx"
            :placeholder="input.label"
            :type="input.type"
            v-model="input.value"
            class="custom-input"
            size="large"
            clearable
            v-bind="input.type === 'password' ? { 'show-password': true } : {}"
        />
        <el-checkbox v-model="rememberPassword" id="rememberPassword" style="margin-left: 1px">记住密码</el-checkbox>
        <el-checkbox v-model="autoLogin" id="autoLogin">自动登录</el-checkbox>
        <div>

        </div>
        <el-button plain v-on:click="login" style="margin-top: 20px">
          <span class="button__text">{{ buttonText }}</span>
        </el-button>
        <div style="margin-top: 20px">
          <el-button :icon="Search" circle />
          <el-button type="primary" :icon="Edit" circle />
          <el-button type="success" :icon="Check" circle />
          <el-button type="info" :icon="Message" circle />
          <el-button type="warning" :icon="Star" circle />
        </div>
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
	background: linear-gradient(45deg, #c6fbe5c0, #ffef89c0);
}
.container {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
}

.screen {		
	background: linear-gradient(90deg, #afffd6, #fdffb7);
	position: relative;
	height: 600px;
	width: 480px;
	box-shadow: 0px 0px 24px #358355;
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
	background: #d7ffb3;
	top: -172px;
	right: 0;	
	border-radius: 32px;
}

.screen__background__shape3 {
	height: 540px;
	width: 190px;
	background: linear-gradient(0deg, #fbffb9, #ceffea);
	top: -24px;
	right: 0;	
	border-radius: 32px;
}

.screen__background__shape4 {
	height: 400px;
	width: 200px;
	background: linear-gradient(0deg, #bcf685, #ceffea);
	top: 420px;
	right: 40px;
	border-radius: 60px;
}

.custom-input {
  width: 320px;
  margin-bottom: 15px;
  margin-top: 20px;
  font-size: 15px;
}

.login {
	width: 320px;
	padding: 30px;
	padding-top: 50px;
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

/*波浪线*/
.wave-line-css {
  width: 300px;
  height: 10px;
  background: linear-gradient(to right, #f7fb5c, #abffdd);
  mask-image: linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent);
  mask-size: 20px 20px;
}
</style>
