package edu.whu.MagicNote.controller;

import com.alibaba.fastjson.JSONObject;
import edu.whu.MagicNote.exception.TodoException;
import edu.whu.MagicNote.service.impl.MinioService;
import io.minio.errors.MinioException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

@RestController
@RequestMapping("/minio")
public class MinioController {
    @Autowired
    private MinioService minioService;
    @PostMapping("/upload")
    public ResponseEntity<JSONObject> upload(MultipartFile file,String bucketName) {
        JSONObject result = new JSONObject();
        try {
            result = minioService.uploadFile(file, bucketName);
        } catch (Exception e) {
            result.put("code",TodoException.MINIO_ERROR);
            result.put("message","上传失败");
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/download")
    public ResponseEntity<InputStreamResource> downloadFile(String bucketName, String objectName) {
        try {
            InputStream inputStream = minioService.downloadFile(bucketName, objectName);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", objectName);
            headers.set(HttpHeaders.CONTENT_ENCODING, StandardCharsets.UTF_8.name());
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(new InputStreamResource(inputStream));
        } catch (MinioException | IOException| NoSuchAlgorithmException | InvalidKeyException  e) {
            // 处理MinIO异常或文件读取错误
            return ResponseEntity.notFound().build();
        }
    }
}
