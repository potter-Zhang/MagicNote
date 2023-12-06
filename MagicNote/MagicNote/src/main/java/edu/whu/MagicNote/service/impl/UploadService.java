package edu.whu.MagicNote.service.impl;

import com.alibaba.dashscope.exception.InputRequiredException;
import com.alibaba.dashscope.exception.NoApiKeyException;
import com.alibaba.fastjson.JSONObject;
import edu.whu.MagicNote.domain.Photo;
import edu.whu.MagicNote.exception.TodoException;
import edu.whu.MagicNote.service.IPhotoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UploadService {
    @Autowired
    IPhotoService photoService;

    @Autowired
    OcrService ocrService;

    @Autowired
    MinioService minioService;

    @Autowired
    AIFunctionService aiFunctionService;


    // 处理上传图片文件操作，将上传的图片保存（这里的设计是贴合Editor的控件来的，若不使用editor需要修改)
    // 需要注意这里传入的参数还有图片所属的用户的id与图片所属的笔记的id
    public JSONObject photoUpload(MultipartFile file, int userid, int noteid) throws Exception {

        // 进行图片中的文字识别
        String words = ocrService.recognizeImg(file);
        System.out.println(words);

        // 使用大模型对ocr的结果进行优化，修改错别字等等
        words = aiFunctionService.polish(words);

        // 上传图片到服务器
        JSONObject result = minioService.uploadFile(file, "photo");

        // 设置文件路径，根据minio中路径
        String filePath = "http://118.178.241.148:9000/photo/" + result.get("fileName");

        // 添加photo信息到photo表
        Photo photo = new Photo();
        photo.setPath(filePath);
        photo.setUserid(userid);
        photo.setNoteid(noteid);
        photo.setContent(words);
        photoService.addPhoto(photo);

        // 给editormd进行回调
        JSONObject res = new JSONObject();
        res.put("url", filePath);
        res.put("success", 1);
        res.put("message", "upload success!");

        return res;
    }


    // 处理上传视频与音频操作，将上传的视频和音频保存
    public void fileUpload(MultipartFile file) throws Exception {
        /*
        File realPath = new File(path);
        if (!realPath.exists()){
            realPath.mkdir();
        }

        String filename = file.getOriginalFilename();
        String suffix = filename.substring(filename.lastIndexOf("."));

        String randomName = UUID.randomUUID().toString();
        filename = randomName + suffix;

        file.transferTo(new File(realPath +"/"+ filename));
        */

        // 上传文件到服务器
        JSONObject result = minioService.uploadFile(file, "videoandaudio");

        // 设置文件路径，根据minio中路径
        String filePath = "http://118.178.241.148:9000/videoandaudio/" + result.get("fileName");

        return;
    }


    // 上传用户头像的接口，返回头像文件在minio中的url
    public String userPhotoUpload(MultipartFile file) throws Exception {

        // 上传头像文件到服务器
        JSONObject result = minioService.uploadFile(file, "userphoto");

        // 设置文件路径，根据minio中路径
        String filePath = "http://118.178.241.148:9000/userphoto/" + result.get("fileName");

        return filePath;
    }
}
