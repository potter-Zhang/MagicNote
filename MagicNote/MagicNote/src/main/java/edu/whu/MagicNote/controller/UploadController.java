package edu.whu.MagicNote.controller;

import com.alibaba.fastjson.JSONObject;
import edu.whu.MagicNote.service.impl.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("upload")
public class UploadController {

    @Autowired
    OcrService ocrService;
    @Autowired
    MinioService minioService;

    private static final Logger log = LoggerFactory.getLogger(UploadController.class);

    // 处理上传图片文件操作，将上传的图片保存（这里的设计是贴合Editor的控件来的，若不使用editor需要修改)
    // 需要注意这里传入的参数还有图片所属的用户的id与图片所属的笔记的id
    @PostMapping("/photo/{userid}/{noteid}")
    @ResponseBody
    public JSONObject photoUpload(@RequestParam(value = "editormd-image-file", required = true) MultipartFile file, @PathVariable int userid , @PathVariable int noteid) {
        JSONObject res = new JSONObject();
        try {
            log.info("Start");
            // 上传图片到服务器
            JSONObject result = minioService.uploadFile(file, "photo");

            // 设置文件路径，根据minio中路径
            String filePath = "http://118.178.241.148:9000/photo/" + result.get("fileName");

            // 异步进行ocr和识别文字的存储
            ocrService.ocrProcess(file,userid,noteid,filePath);

            // 给editormd进行回调
            res.put("url", filePath);
            res.put("success", 1);
            res.put("message", "upload success!");
        }
        catch(Exception e) {
            res.put("error", e.getMessage());
        }
        finally{
            if(res.size()==0){
                res.put("message", "unknown error");
            }
            log.info("End");
            return res;
        }
    }
}
