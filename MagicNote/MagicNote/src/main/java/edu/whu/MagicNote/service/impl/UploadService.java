package edu.whu.MagicNote.service.impl;

import com.alibaba.fastjson.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UploadService {

    @Autowired
    MinioService minioService;

    // 上传用户头像的接口，返回头像文件在minio中的url
    public String userPhotoUpload(MultipartFile file) throws Exception {

        // 上传头像文件到服务器
        JSONObject result = minioService.uploadFile(file, "userphoto");
        // 设置文件路径，根据minio中路径
        String filePath = "http://118.178.241.148:9000/userphoto/" + result.get("fileName");
        return filePath;
    }
}
