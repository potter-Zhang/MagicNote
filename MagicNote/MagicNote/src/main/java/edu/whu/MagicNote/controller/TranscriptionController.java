package edu.whu.MagicNote.controller;

import com.alibaba.dashscope.exception.InputRequiredException;
import com.alibaba.dashscope.exception.NoApiKeyException;
import com.alibaba.fastjson.JSONObject;
import edu.whu.MagicNote.service.impl.AIFunctionService;
import edu.whu.MagicNote.service.impl.MinioService;
import edu.whu.MagicNote.service.impl.TranscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/transcribe")
public class TranscriptionController {
    @Autowired
    TranscriptionService ts;
    @Autowired
    AIFunctionService ai;
    @Autowired
    MinioService minioService;
    @PostMapping
    public ResponseEntity<String> transcribeAudio(MultipartFile file) throws NoApiKeyException, InputRequiredException {
        try {
            //识别视频内容并进行修改
            JSONObject uploadFile = minioService.uploadFile(file, "videoandaudio");
            String fileName = String.valueOf(uploadFile.get("fileName"));
            String ip = String.valueOf(uploadFile.get("endPoint"));
            String filepath = ip+"/videoandaudio/"+fileName;
            String Result = ts.transcribe(filepath);
            Result = ai.polish(Result);
            minioService.deleteFile("videoandaudio",fileName);
            return Result == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(Result);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}