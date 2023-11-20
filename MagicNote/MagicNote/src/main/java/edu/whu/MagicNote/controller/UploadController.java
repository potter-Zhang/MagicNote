package edu.whu.MagicNote.controller;

import com.alibaba.fastjson.JSONObject;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.io.File;
import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/upload")
public class UploadController {

    // 处理上传图片文件操作，将上传的图片保存（这里的设计是贴合Editor的控件来的，若不使用editor需要修改)
    @RequestMapping("/photo")
    @ResponseBody
    public JSONObject photoUpload(@RequestParam(value = "editormd-image-file", required = true) MultipartFile file, HttpServletRequest request) throws IOException {
        //上传路径保存设置

        //获得SpringBoot当前项目的路径：System.getProperty("user.dir")
        String path = System.getProperty("user.dir")+"/upload/";
        System.out.println(path);

        File realPath = new File(path);
        if (!realPath.exists()){
            realPath.mkdir();
        }

        //上传文件地址
        System.out.println("上传文件保存地址："+realPath);

        //解决文件名字问题：我们使用uuid;
        String filename = "ks-"+ UUID.randomUUID().toString().replaceAll("-", "");
        //通过CommonsMultipartFile的方法直接写文件（注意这个时候）
        file.transferTo(new File(realPath +"/"+ filename));

        //给editormd进行回调
        JSONObject res = new JSONObject();
        res.put("url","/upload/"+ filename);
        res.put("success", 1);
        res.put("message", "upload success!");

        return res;
    }


    // 处理上传视频与音频操作，将上传的视频和音频保存
    @RequestMapping("/videoAndAudio")
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