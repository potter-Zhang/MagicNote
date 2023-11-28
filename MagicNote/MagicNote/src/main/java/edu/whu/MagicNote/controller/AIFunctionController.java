package edu.whu.MagicNote.controller;

import com.alibaba.dashscope.exception.InputRequiredException;
import com.alibaba.dashscope.exception.NoApiKeyException;
import edu.whu.MagicNote.service.impl.AIFunctionService;
import edu.whu.MagicNote.service.impl.QAndAService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ai")
public class AIFunctionController {

    @Autowired
    private AIFunctionService aiFunctionService;

    @Autowired
    private QAndAService qAndAService;


    // 获取输入文字的摘要，或者说将输入文字精简、提取关键信息
    @PostMapping("/abstract")
    public ResponseEntity<String> abstractNote(@RequestBody AIObject aiObject) throws NoApiKeyException, InputRequiredException {
        String result = aiFunctionService.abstractNote(aiObject.getStr());
        return ResponseEntity.ok(result);
    }


    // 扩写输入文字
    @PostMapping("/expand")
    public ResponseEntity<String> expandNote(@RequestBody AIObject aiObject) throws NoApiKeyException, InputRequiredException {
        String result = aiFunctionService.expandNote(aiObject.getStr());
        return ResponseEntity.ok(result);
    }


    // 将输入文字分段
    @PostMapping("/segment")
    public ResponseEntity<String> segmentNote(@RequestBody AIObject aiObject) throws NoApiKeyException, InputRequiredException {
        String result = aiFunctionService.segmentNote(aiObject.getStr());
        return ResponseEntity.ok(result);
    }


    // 根据关键词，自动生成笔记
    @PostMapping("/generate")
    public ResponseEntity<String> generateNote(@RequestBody AIObject aiObject) throws NoApiKeyException, InputRequiredException {
        String result = aiFunctionService.generateNote(aiObject.getStr(), aiObject.getNum());
        return ResponseEntity.ok(result);
    }


    // 根据笔记的合适内容生成表格
    @PostMapping("/generateTable")
    public ResponseEntity<String> generateTable(@RequestBody AIObject aiObject) throws NoApiKeyException, InputRequiredException {
        String result = aiFunctionService.generateTable(aiObject.getStr());
        return ResponseEntity.ok(result);
    }

    // 根据笔记的合适内容生成流程图
    @PostMapping("/generateFlowChart")
    public ResponseEntity<String> generateFlowChart(@RequestBody AIObject aiObject) throws NoApiKeyException, InputRequiredException {
        String result = aiFunctionService.generateFlowChart(aiObject.getStr());
        return ResponseEntity.ok(result);
    }

    // 初始化问答模型的接口，在进入某个笔记的编辑界面时调用，以初始化，以便之后进行多轮问答
    @PostMapping("/init")
    public ResponseEntity<Void> initQAndA(@RequestBody AIObject aiObject) throws NoApiKeyException, InputRequiredException {
        qAndAService.init(aiObject.getStr());
        return ResponseEntity.ok().build();
    }

    // 回答问题时调用的接口
    @PostMapping("/answer")
    public ResponseEntity<String> getAnswer(@RequestBody AIObject aiObject) throws NoApiKeyException, InputRequiredException {
        String answer = qAndAService.answer(aiObject.getStr());
        return ResponseEntity.ok(answer);
    }


    @Data
    // 用于封装ai功能中的参数的类
    public class AIObject{
        private String str;
        private int num;   // 这个字段只在自动生成笔记接口中使用，其他接口的该字段可以随便赋值
    }

}
