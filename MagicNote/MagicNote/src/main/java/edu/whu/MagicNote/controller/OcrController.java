package edu.whu.MagicNote.controller;

import com.alibaba.dashscope.exception.InputRequiredException;
import com.alibaba.dashscope.exception.NoApiKeyException;
import com.alibaba.fastjson.JSONObject;
import edu.whu.MagicNote.exception.TodoException;
import edu.whu.MagicNote.service.impl.AIFunctionService;
import edu.whu.MagicNote.service.impl.MinioService;
import edu.whu.MagicNote.service.impl.OcrService;
import lombok.AllArgsConstructor;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

@RestController
@RequestMapping("/ocr")
@AllArgsConstructor
public class OcrController {
    @Autowired
    private final OcrService ocrService;
    @Autowired
    AIFunctionService ai;
    @Autowired
    private MinioService minioService;
    //识别图片
    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> recognizeImage(MultipartFile file) throws TesseractException, IOException {
        // 调用OcrService中的方法进行文字识别
        String result;
        try {
            JSONObject uploadFile = minioService.uploadFile(file,"photo");
            String fileName = String.valueOf(uploadFile.get("fileName"));
            // 获取输入流
            InputStream inputStream = minioService.downloadFile("photo", fileName);
            // 构建MultipartFile对象
            MultipartFile multipartFile = new MockMultipartFile(fileName, inputStream);
            // 设置文件内容长度和类型
            multipartFile = new MockMultipartFile(multipartFile.getName(),
                    multipartFile.getOriginalFilename(), multipartFile.getContentType(),
                    multipartFile.getBytes());
            //识别图片结果并进行修改
            result=ocrService.recognizePdf(multipartFile);
            //result = ai.polish(result);
        } catch (TodoException e) {
            return ResponseEntity.badRequest().body(e.getCode() + e.getMessage());
        } catch (NoApiKeyException e) {
            throw new RuntimeException(e);
        } catch (InputRequiredException e) {
            throw new RuntimeException(e);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return ResponseEntity.ok(result);
    }
    //识别pdf
    @PostMapping(value = "/pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> recognizePdf(MultipartFile file) {
        // 调用OcrService中的方法进行文字识别
        String result;
        try {
            JSONObject uploadFile = minioService.uploadFile(file,"pdf");
            String fileName = String.valueOf(uploadFile.get("fileName"));
            // 获取输入流
            InputStream inputStream = minioService.downloadFile("pdf", fileName);
            // 构建MultipartFile对象
            MultipartFile multipartFile = new MockMultipartFile(fileName, inputStream);
            // 设置文件内容长度和类型
            multipartFile = new MockMultipartFile(multipartFile.getName(),
                    multipartFile.getOriginalFilename(), multipartFile.getContentType(),
                    multipartFile.getBytes());
            //识别pdf结果并进行修改
            result=ocrService.recognizePdf(multipartFile);
            //result = ai.polish(result);
            minioService.deleteFile("pdf",fileName);
        } catch (TodoException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IOException e) {
            throw new RuntimeException(e);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return ResponseEntity.ok(result);
    }

    //识别ppt
    @PostMapping(value = "/ppt", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> recognizePPT(MultipartFile file) throws IOException {
        // 调用OcrService中的方法进行文字识别
        String result;
        try {
            JSONObject uploadFile = minioService.uploadFile(file,"ppt");
            String fileName = String.valueOf(uploadFile.get("fileName"));
            // 获取输入流
            InputStream inputStream = minioService.downloadFile("ppt",fileName);
            // 构建MultipartFile对象
            MultipartFile multipartFile = new MockMultipartFile(fileName, inputStream);
            // 设置文件内容长度和类型
            multipartFile = new MockMultipartFile(multipartFile.getName(),
                    multipartFile.getOriginalFilename(), multipartFile.getContentType(),
                    multipartFile.getBytes());
            //识别ppt结果并进行修改
            result=ocrService.recognizePPT(multipartFile);
            //result = ai.polish(result);
            minioService.deleteFile("ppt",fileName);
        } catch (TodoException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return ResponseEntity.ok().body(result);
    }
}
