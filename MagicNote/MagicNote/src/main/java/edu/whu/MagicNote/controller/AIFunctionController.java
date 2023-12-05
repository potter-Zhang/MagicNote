package edu.whu.MagicNote.controller;

import com.alibaba.dashscope.exception.InputRequiredException;
import com.alibaba.dashscope.exception.NoApiKeyException;
import edu.whu.MagicNote.domain.AIObject;
import edu.whu.MagicNote.service.impl.AIFunctionService;
import edu.whu.MagicNote.service.impl.QAndAService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@RestController
@RequestMapping("/ai")
public class AIFunctionController {

    @Autowired
    private AIFunctionService aiFunctionService;

    @Autowired
    private QAndAService qAndAService;


    // 获取输入文字的摘要，或者说将输入文字精简、提取关键信息（通义千问版）
    @GetMapping("/abstract")
    public ResponseEntity<Void> abstractNote(AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.abstractNote(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (NoApiKeyException | InputRequiredException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 获取笔记摘要（GPT版）
    @GetMapping("/abstractGPT")
    public ResponseEntity<Void> abstractNoteGPT(AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.abstractNoteGPT(aiObject.getStr(), response);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 扩写输入文字（通义千问版）
    @GetMapping("/expand")
    public ResponseEntity<Void> expandNote(AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.expandNote(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (NoApiKeyException | InputRequiredException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 扩写输入文字（GPT版）
    @GetMapping("/expandGPT")
    public ResponseEntity<Void> expandNoteGPT(AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.expandNoteGPT(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 将输入文字分段
    @GetMapping("/segment")
    public ResponseEntity<Void> segmentNote(AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.segmentNote(aiObject.getStr(), response);
            return ResponseEntity.ok().build();
        } catch (NoApiKeyException | InputRequiredException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/segmentGPT")
    public ResponseEntity<Void> segmentNoteGPT(AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.segmentNoteGPT(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }


    // 根据关键词，自动生成笔记
    @GetMapping("/generate")
    public ResponseEntity<Void> generateNote(AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.generateNote(aiObject.getStr(),aiObject.getNum(),response);
            return ResponseEntity.ok().build();
        } catch (NoApiKeyException | InputRequiredException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/generateGPT")
    public ResponseEntity<Void> generateNoteGPT(AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.generateNoteGPT(aiObject.getStr(),aiObject.getNum(),response);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 根据笔记的合适内容生成表格
    @GetMapping("/generateTable")
    public ResponseEntity<Void> generateTable(AIObject aiObject, HttpServletResponse response) throws NoApiKeyException, InputRequiredException {
        try {
            aiFunctionService.generateTable(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (NoApiKeyException | InputRequiredException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/generateTableGPT")
    public ResponseEntity<Void> generateTableGPT(AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.generateTableGPT(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 根据笔记的合适内容生成流程图
    @GetMapping("/generateFlowChart")
    public ResponseEntity<Void> generateFlowChart(AIObject aiObject, HttpServletResponse response) throws NoApiKeyException, InputRequiredException {
        try {
            aiFunctionService.generateFlowChart(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (NoApiKeyException | InputRequiredException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/generateFlowGPT")
    public ResponseEntity<Void> generateFlowGPT(AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.generateFlowChartGPT(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 初始化问答模型的接口，在进入某个笔记的编辑界面时调用，以初始化，以便之后进行多轮问答
    @PostMapping("/init")
    public ResponseEntity<Void> initQAndA(@RequestBody AIObject aiObject) throws NoApiKeyException, InputRequiredException {
        qAndAService.init(aiObject.getStr());
        return ResponseEntity.ok().build();
    }

    // 回答问题时调用的接口
    @GetMapping("/answer")
    public ResponseEntity<String> getAnswer(String str, HttpServletResponse response) {
        try {
            qAndAService.answer(str,response);
            return ResponseEntity.ok().build();
        } catch (NoApiKeyException | InputRequiredException e) {
            return ResponseEntity.badRequest().build();
        }
    }

}
