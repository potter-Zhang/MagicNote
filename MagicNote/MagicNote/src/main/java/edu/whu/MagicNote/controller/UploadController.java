package edu.whu.MagicNote.controller;

import com.alibaba.fastjson.JSONObject;
import edu.whu.MagicNote.domain.Photo;
import edu.whu.MagicNote.exception.TodoException;
import edu.whu.MagicNote.service.IPhotoService;
import edu.whu.MagicNote.service.impl.OcrService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/upload")
public class UploadController {

    @Autowired
    IPhotoService photoService;

    @Autowired
    OcrService ocrService;

    // 处理上传图片文件操作，将上传的图片保存（这里的设计是贴合Editor的控件来的，若不使用editor需要修改)
    // 需要注意这里传入的参数还有图片所属的用户的id与图片所属的笔记的id
    //@RequestMapping("/photo")
    @PostMapping("/photo")
    @ResponseBody
    public JSONObject photoUpload(@RequestParam(value = "editormd-image-file", required = true) MultipartFile file, int userid ,int noteid) throws IOException, TodoException {

        // 进行图片中的文字识别
        String words = ocrService.recognizeImg(file);
        System.out.println(words);

        // 获得SpringBoot当前项目的路径：System.getProperty("user.dir")
        String path = System.getProperty("user.dir")+"/upload/";
        System.out.println(path);

        File realPath = new File(path);
        if (!realPath.exists()){
            realPath.mkdir();
        }

        // 解决文件名字问题，这里使用uuid;
        String filename = "ks-"+ UUID.randomUUID().toString().replaceAll("-", "");
        String filePath = realPath +"/"+ filename;

        // 通过CommonsMultipartFile的方法直接写文件
        file.transferTo(new File(filePath));

        // 添加photo信息到photo表
        Photo photo = new Photo();
        photo.setPath(filePath);
        photo.setUserid(userid);
        photo.setNoteid(noteid);
        photo.setContent(words);
        photoService.addPhoto(photo);

        // 给editormd进行回调
        JSONObject res = new JSONObject();
        res.put("url","/upload/"+ filename);
        res.put("success", 1);
        res.put("message", "upload success!");

        return res;
    }


    // 处理上传视频与音频操作，将上传的视频和音频保存
    @PostMapping("/videoAndAudio")
    @ResponseBody
    public ResponseEntity<Void> fileUpload(MultipartFile file) throws IOException {

        //获得SpringBoot当前项目的路径：System.getProperty("user.dir")
        String path = System.getProperty("user.dir")+"/upload/";
        //System.out.println(path);

        File realPath = new File(path);
        if (!realPath.exists()){
            realPath.mkdir();
        }

        String filename = file.getOriginalFilename();
        String suffix = filename.substring(filename.lastIndexOf("."));

        String randomName = UUID.randomUUID().toString();
        filename = randomName + suffix;

        file.transferTo(new File(realPath +"/"+ filename));

        return ResponseEntity.ok().build();
    }
}
