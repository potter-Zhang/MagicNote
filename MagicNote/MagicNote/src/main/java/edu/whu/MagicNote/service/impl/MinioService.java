package edu.whu.MagicNote.service.impl;

import com.alibaba.fastjson.JSONObject;
import edu.whu.MagicNote.domain.MinioProp;
import edu.whu.MagicNote.exception.TodoException;
import io.minio.*;
import io.minio.errors.*;
import io.minio.messages.Bucket;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.List;

@Slf4j
@Component
public class MinioService {
    @Autowired
    private MinioClient client;
    @Autowired
    private MinioProp minioProp;
    /**
     * 创建bucket
     */
    public void createBucket(String bucketName) throws TodoException {
        BucketExistsArgs bucketExistsArgs = BucketExistsArgs.builder().bucket(bucketName).build();
        MakeBucketArgs makeBucketArgs = MakeBucketArgs.builder().bucket(bucketName).build();
        try {
            if (client.bucketExists(bucketExistsArgs))
                return;
            client.makeBucket(makeBucketArgs);
        } catch (Exception e) {
            log.error("创建桶失败：{}", e.getMessage());
            throw new TodoException(TodoException.MINIO_ERROR,"创建桶失败");
        }
    }

    public List<Bucket> getAllBuckets() throws ServerException, InsufficientDataException, ErrorResponseException, IOException, NoSuchAlgorithmException, InvalidKeyException, InvalidResponseException, XmlParserException, InternalException {
        return client.listBuckets();
    }
    /**
     * @param file       文件
     * @param bucketName 存储桶
     * @return
     */
    public JSONObject uploadFile(MultipartFile file, String bucketName) throws Exception {
        // 判断上传文件是否为空
        if (null == file || 0 == file.getSize()) {
            throw new TodoException(TodoException.MINIO_ERROR,"文件不能为空");
        }
        // 判断存储桶是否存在
        createBucket(bucketName);
        // 文件名
        String originalFilename = file.getOriginalFilename();
        // 新的文件名 = 存储桶名称_时间戳.后缀名
        String fileName = bucketName + "_" + System.currentTimeMillis() +                                                               originalFilename.substring(originalFilename.lastIndexOf("."));
        // 开始上传
        InputStream inputStream = file.getInputStream();
        PutObjectArgs args = PutObjectArgs.builder().bucket(bucketName).object(fileName)
                .stream(inputStream,inputStream.available(),-1).contentType(file.getContentType()).build();
        client.putObject(args);
        JSONObject res = new JSONObject();
        res.put("Endpoint", minioProp.getEndpoint());
        res.put("bucketName", bucketName);
        res.put("fileName", fileName);
        return res;
    }

    public InputStream downloadFile(String bucketName, String objectName) throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        return client.getObject(
                GetObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectName)
                        .build()
        );
    }


}