package edu.whu.MagicNote.domain;

import lombok.Data;

@Data
// 用于封装ai功能中的参数的类
public class AIObject{
    private String str;
    private int num;   // 这个字段只在自动生成笔记接口中使用，其他接口的该字段可以随便赋值
}

