# 数据库设计
## user
+ id(PK)
+ name
+ password
+ photo(file path?)
+ email


## note
+ id(PK)
+ user_id(Foreign Key)
+ name
+ content(文字、图片、文件)（*）
+ createTime
+ directory

## log
+ id(PK)
+ user_id(Foreign Key)
+ note_name
+ timestamp
+ operation


## photo
+ id(PK)
+ noteid(Foreign Key)
+ userid(FK)
+ content
+ path(可能需要)

## notebook
+ id(PK)
+ name
+ userid(FK)