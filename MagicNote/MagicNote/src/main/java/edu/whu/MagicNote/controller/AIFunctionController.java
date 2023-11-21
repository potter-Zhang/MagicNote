package edu.whu.MagicNote.controller;

import edu.whu.MagicNote.domain.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ai")
public class AIFunctionController {

    // 获取输入文字的摘要，或者说将输入文字精简、提取关键信息
    @GetMapping("/abstract")
    public ResponseEntity<String> getAbstract(){

    }


    // 扩写输入文字
    @GetMapping("/expand")
    public ResponseEntity<String> getExpand(@PathVariable int id){

    }

    // 将输入文字分段
    @GetMapping("/segment")
    public ResponseEntity<String> getSegment(@PathVariable int id){

    }

    // 根据关键词，自动生成笔记
    @GetMapping("/generate")
    public ResponseEntity<String> generateNote(@PathVariable int id){

    }
}
