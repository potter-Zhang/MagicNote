package edu.whu.MagicNote.controller;

import com.alibaba.dashscope.exception.InputRequiredException;
import com.alibaba.dashscope.exception.NoApiKeyException;
import edu.whu.MagicNote.service.impl.AIFunctionService;
import edu.whu.MagicNote.service.impl.TranscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/transcribe")
public class TranscriptionController {
    @Autowired
    TranscriptionService ts;
    @Autowired
    AIFunctionService ai;
    @GetMapping("/{filepath}")
    public ResponseEntity<String> transcribeAudio(@PathVariable String filepath) throws NoApiKeyException, InputRequiredException {
        //识别视频内容并进行修改
        String Result = ai.polish(ts.transcribe(filepath));
        return Result==null?ResponseEntity.noContent().build():ResponseEntity.ok(Result);
    }
}