package edu.whu.MagicNote.controller;

import com.alibaba.dashscope.exception.InputRequiredException;
import com.alibaba.dashscope.exception.NoApiKeyException;
import edu.whu.MagicNote.service.impl.AIFunctionService;
import edu.whu.MagicNote.service.impl.QAndAService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ai")
public class AIFunctionController {

    @Autowired
    private AIFunctionService aiFunctionService;

    @Autowired
    private QAndAService qAndAService;


    // 获取输入文字的摘要，或者说将输入文字精简、提取关键信息
    @GetMapping("/abstract")
    public ResponseEntity<String> abstractNote(String note) throws NoApiKeyException, InputRequiredException {
        String result = aiFunctionService.abstractNote(note);
        return ResponseEntity.ok(result);
    }


    // 扩写输入文字
    @GetMapping("/expand")
    public ResponseEntity<String> expandNote(String note) throws NoApiKeyException, InputRequiredException {
        String result = aiFunctionService.expandNote(note);
        return ResponseEntity.ok(result);
    }


    // 将输入文字分段
    @GetMapping("/segment")
    public ResponseEntity<String> segmentNote(String note) throws NoApiKeyException, InputRequiredException {
        String result = aiFunctionService.segmentNote(note);
        return ResponseEntity.ok(result);
    }


    // 根据关键词，自动生成笔记
    @GetMapping("/generate")
    public ResponseEntity<String> generateNote(String words, int num) throws NoApiKeyException, InputRequiredException {
        String result = aiFunctionService.generateNote(words, num);
        return ResponseEntity.ok(result);
    }


    // 根据笔记的合适内容生成表格
    @GetMapping("/generateTable")
    public ResponseEntity<String> generateTable(String note) throws NoApiKeyException, InputRequiredException {
        String result = aiFunctionService.generateTable(note);
        return ResponseEntity.ok(result);
    }

    // 根据笔记的合适内容生成流程图
    @GetMapping("/generateFlowChart")
    public ResponseEntity<String> generateFlowChart(String note) throws NoApiKeyException, InputRequiredException {
        String result = aiFunctionService.generateFlowChart(note);
        return ResponseEntity.ok(result);
    }

    // 初始化问答模型的接口，在进入某个笔记的编辑界面时调用，以初始化，以便之后进行多轮问答
    @GetMapping("/init")
    public ResponseEntity<Void> initQAndA(String note) throws NoApiKeyException, InputRequiredException {
        qAndAService.init(note);
        return ResponseEntity.ok().build();
    }

    // 回答问题时调用的接口
    @GetMapping("/answer")
    public ResponseEntity<String> getAnswer(String question) throws NoApiKeyException, InputRequiredException {
        String answer = qAndAService.answer(question);
        return ResponseEntity.ok(answer);
    }

}
