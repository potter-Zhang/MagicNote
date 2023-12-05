package edu.whu.MagicNote.controller;

import com.alibaba.dashscope.aigc.generation.Generation;
import com.alibaba.dashscope.aigc.generation.GenerationResult;
import com.alibaba.dashscope.aigc.generation.models.QwenParam;
import com.alibaba.dashscope.common.Message;
import com.alibaba.dashscope.common.MessageManager;
import com.alibaba.dashscope.common.Role;
import com.alibaba.dashscope.utils.Constants;
import com.alibaba.fastjson.JSONObject;
import edu.whu.MagicNote.domain.Photo;
import edu.whu.MagicNote.domain.User;
import edu.whu.MagicNote.exception.TodoException;
import edu.whu.MagicNote.service.IPhotoService;
import edu.whu.MagicNote.service.IUserService;
import edu.whu.MagicNote.service.impl.MinioService;
import edu.whu.MagicNote.service.impl.OcrService;
import edu.whu.MagicNote.service.impl.UploadService;
import edu.whu.MagicNote.service.impl.UserServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("upload")
public class UploadController {

    @Autowired
    UploadService uploadService;

    // 处理上传图片文件操作，将上传的图片保存（这里的设计是贴合Editor的控件来的，若不使用editor需要修改)
    // 需要注意这里传入的参数还有图片所属的用户的id与图片所属的笔记的id
    @PostMapping("/photo/{userid}/{noteid}")
    @ResponseBody
    public JSONObject photoUpload(@RequestParam(value = "editormd-image-file", required = true) MultipartFile file, @PathVariable int userid , @PathVariable int noteid) {
        JSONObject res = new JSONObject();
        try {
            res = uploadService.photoUpload(file,userid,noteid);
            return res;
        }
        catch(Exception e) {
            res.put("error",e.getMessage());
            return res;
        }
    }


    // 处理上传视频与音频操作，将上传的视频和音频保存
    @PostMapping("/videoAndAudio")
    @ResponseBody
    public ResponseEntity<Void> fileUpload(MultipartFile file) {
        try {
            uploadService.fileUpload(file);
            return ResponseEntity.ok().build();
        }
        catch(Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
