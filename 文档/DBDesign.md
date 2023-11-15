# 数据库设计
## user
+ id(PK)
+ name
+ email(还没加*)
+ password
+ photo(file path?)
+ 


## note
+ id(PK)
+ user_id(Foreign Key)
+ name
+ content(文字、图片、文件)（*）
+ create_time
+ directory

## log
+ id(PK)
+ user_id(Foreign Key)
+ note_name
+ timestamp
+ operation
