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
    @PostMapping("/abstract")
    public ResponseEntity<Void> abstractNote(@RequestBody AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.abstractNote(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (NoApiKeyException | InputRequiredException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 获取笔记摘要（GPT版）
    @PostMapping("/abstractGPT")
    public ResponseEntity<Void> abstractNoteGPT(@RequestBody AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.abstractNoteGPT(aiObject.getStr(), response);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 扩写输入文字（通义千问版）
    @PostMapping("/expand")
    public ResponseEntity<Void> expandNote(@RequestBody AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.expandNote(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (NoApiKeyException | InputRequiredException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 扩写输入文字（GPT版）
    @PostMapping("/expandGPT")
    public ResponseEntity<Void> expandNoteGPT(@RequestBody AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.expandNoteGPT(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 将输入文字分段
    @PostMapping("/segment")
    public ResponseEntity<Void> segmentNote(@RequestBody AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.segmentNote(aiObject.getStr(), response);
            return ResponseEntity.ok().build();
        } catch (NoApiKeyException | InputRequiredException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/segmentGPT")
    public ResponseEntity<Void> segmentNoteGPT(@RequestBody AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.segmentNoteGPT(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }


    // 根据关键词，自动生成笔记
    @PostMapping("/generate")
    public ResponseEntity<Void> generateNote(@RequestBody AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.generateNote(aiObject.getStr(),aiObject.getNum(),response);
            return ResponseEntity.ok().build();
        } catch (NoApiKeyException | InputRequiredException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/generateGPT")
    public ResponseEntity<Void> generateNoteGPT(@RequestBody AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.generateNoteGPT(aiObject.getStr(),aiObject.getNum(),response);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 根据笔记的合适内容生成表格
    @PostMapping("/generateTable")
    public ResponseEntity<Void> generateTable(@RequestBody AIObject aiObject, HttpServletResponse response) throws NoApiKeyException, InputRequiredException {
        try {
            aiFunctionService.generateTable(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (NoApiKeyException | InputRequiredException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/generateTableGPT")
    public ResponseEntity<Void> generateTableGPT(@RequestBody AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.generateTableGPT(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 根据笔记的合适内容生成流程图
    @PostMapping("/generateFlowChart")
    public ResponseEntity<Void> generateFlowChart(@RequestBody AIObject aiObject, HttpServletResponse response) throws NoApiKeyException, InputRequiredException {
        try {
            aiFunctionService.generateFlowChart(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (NoApiKeyException | InputRequiredException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/generateFlowGPT")
    public ResponseEntity<Void> generateFlowGPT(@RequestBody AIObject aiObject, HttpServletResponse response) {
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
    @PostMapping("/answer")
    public ResponseEntity<String> getAnswer(@RequestBody AIObject aiObject, HttpServletResponse response) {
        try {
            qAndAService.answer(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (NoApiKeyException | InputRequiredException e) {
            return ResponseEntity.badRequest().build();
        }
    }

}
