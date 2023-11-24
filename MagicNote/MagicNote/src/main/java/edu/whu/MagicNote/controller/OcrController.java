package edu.whu.MagicNote.controller;

import edu.whu.MagicNote.exception.TodoException;
import edu.whu.MagicNote.service.impl.OcrService;
import lombok.AllArgsConstructor;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
@RestController
@RequestMapping("/ocr")
@AllArgsConstructor
public class OcrController {
    @Autowired
    private final OcrService ocrService;
    //识别图片
    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> recognizeImage(@RequestParam("file") MultipartFile file) throws TesseractException, IOException {
        // 调用OcrService中的方法进行文字识别
        String result;
        try {
            result = ocrService.recognizeImg(file);
        } catch (TodoException e) {
            return ResponseEntity.badRequest().body(e.getCode() + e.getMessage());
        }
        return ResponseEntity.ok(result);
    }
    //识别pdf
    @PostMapping(value = "/pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> recognizePdf(@RequestParam("file") MultipartFile file) {
        // 调用OcrService中的方法进行文字识别
        String result;
        try {
            result = ocrService.recognizePdf(file);
        } catch (TodoException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
        return ResponseEntity.ok(result);
    }

    //识别ppt
    @PostMapping(value = "/ppt", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> recognizePPT(@RequestParam("file") MultipartFile file) {
        // 调用OcrService中的方法进行文字识别
        String result;
        try {
            result = ocrService.recognizePPT(file);
        } catch (TodoException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
        return ResponseEntity.ok(result);
    }
}
