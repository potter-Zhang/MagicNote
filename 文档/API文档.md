## 登录注册

* 用户名登录：/login

  * request body:

  ```json
  {
    "name": "",
    "password": ""
  }
  ```

  * 返回结果:

    成功则返回该User的信息和token：

  ```json
  {
    "name": "",
    "photo": "http://118.178.241.148:9000/userphoto/userphoto_1701490298283.jpg",
    "id": "",
    "email": "",
    "token": ""
  }
  ```

  ​	失败则返回失败原因：

  ```json
  {
    "error": ""
  }
  ```

  

* 邮箱登录：/loginByEmail

  * request body:

  ```json
  {
    "email": "",
    "password": ""
  }
  ```
  
  * 返回结果与/login一致
  
  
  
* 用户名注册: /register

  * request body:

  ```json
  {
    "name": "",
    "password": ""
  }
  ```

  * 返回结果:

    成功则返回新用户的信息：

  ```json
  {
    "name": "",
    "photo": "http://118.178.241.148:9000/userphoto/userphoto_1701490298283.jpg",
    "id": "",
    "email": "",
    "token": ""
  }
  ```

  ​	失败返回失败原因(用户名已存在):

  ```json
  {
    "error": ""
  }
  ```

  

* 邮箱注册：/registerByEmail

  * request body:

  ```json
  {
    "email": "",
    "password": ""
  }
  ```

  * 返回结果与/register一致

  

## 操作日志

* 获取当前用户全部日志：/log/getall/{id}

  * 返回结果：

    成功则返回日志列表
  
  ```json
  [
    {
      "id": "",
      "userid": "",
      "notename": "",
      "timestamp": "",
      "operation": "",
      "noteid": ""
    },
    {
      "id": "",
      "userid": "",
      "notename": "",
      "timestamp": "",
      "operation": "",
      "noteid": ""
    },
    ...
  ]
  ```
  
  

## 笔记本

* 添加笔记本：/notebook/add

  * Request body:

  ```json
  {
    "userid": "",
    "name": "",
  }
  ```

  * 返回结果：

  ```json
  {
    "id": "",	// 成功则返回插入后的笔记本id
    "name": "",
    "userid": ""
  }
  ```

  ```json
  {
    "code": "",
    "message": "" //失败返回失败原因，用户不能创建同名的笔记本
  }
  ```

  

* 删除笔记本：/notebook/delete/{id}



* 重命名笔记本：/notebook/update

  * request body:

  ```json
  {
    "userid": "",
    "id": "",
    "name": ""
  }
  ```

  

* 查找笔记本: /notebook/getByUser/{id}

  * 返回结果：

  ```json
  [
    {
        "id": ,
        "name": "",
        "userid": ""
    },
    {
        "id": "",
        "name": "",
        "userid": ""
    },
  	...
  ]
  ```



## 笔记

* 获取笔记本中的全部笔记: /note/getByNotebook/{id}

  * 返回结果:

  ```json
  [
    {
      "id": "",
      "name": "",
      "userid": "",
      "content": "",
      "notebookid": ""
    },
    {
      "id": "",
      "name": "",
      "userid": "",
      "content": "",
      "notebookid": ""
    },
    ...
  ]
  ```

  

* 添加笔记：/note/add

  * request body:

  ```json
  {
    "userid": "",
    "content": "",
    "name": "",
    "notebookid": ""
  }
  ```

  * 成功新建笔记的属性:

  ```json
  {
    "id": "",
    "name": "",
    "userid": "",
    "notebookid": "",
  }
  ```

  * 失败返回失败原因

  

* 删除笔记：/note/delete/{id}



## AI

* 摘要: /ai/abstract
* 扩写: /ai/expand
* 分段: /ai/segment
* 生成表格: /ai/generateTable
* 生成流程图：/ai/generateFlowChart
* ai对话：/ai/answer