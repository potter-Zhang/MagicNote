package edu.whu.MagicNote.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import edu.whu.MagicNote.dao.*;
import edu.whu.MagicNote.domain.User;
import edu.whu.MagicNote.service.IUserService;
import io.minio.errors.*;
import org.apache.commons.math3.analysis.function.Min;
import org.checkerframework.checker.units.qual.A;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.sql.rowset.serial.SerialBlob;
import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.sql.Blob;
import java.sql.SQLException;
/**
 * <p>
 *  服务实现类
 * </p>
 *
 * @author susong
 * @since 2023-11-14
 */
@Service
public class UserServiceImpl extends ServiceImpl<UserDao, User> implements IUserService {

    @Autowired
    NoteDao noteDao;

    @Autowired
    NotebookDao notebookDao;

    @Autowired
    PhotoDao photoDao;

    @Autowired
    LogDao logDao;

    @Autowired
    UserDao userDao;

    @Autowired
    UploadService uploadService;

    @Autowired
    MinioService minioService;

    @Override
    public User getUserById(int id){
        return this.getById(id);
    }

    @Override
    public User getUserByName(String name){
        LambdaQueryWrapper<User> lqw = new LambdaQueryWrapper<>();
        lqw.eq(User::getName, name);
        User user = this.baseMapper.selectOne(lqw);
        return user;
    }

    @Override
    public User getUserByEmail(String Email) {
        LambdaQueryWrapper<User> lqw = new LambdaQueryWrapper<>();
        lqw.eq(User::getEmail, Email);
        User user = this.baseMapper.selectOne(lqw);
        return user;
    }

    @Override
    public User addUser(User user){
        user.setPassword(new BCryptPasswordEncoder().encode(user.getPassword()));
        this.baseMapper.insert(user);
        return user;
    }

    @Override
    public boolean updateUser(User user){
        return this.updateById(user);
    }

    @Override
    public boolean updateUserName(int id, String name){
        User newUser = new User();
        User oldUser = this.getById(id);
        newUser.setId(oldUser.getId());
        newUser.setName(name);
        newUser.setPassword(oldUser.getPassword());
        newUser.setPhoto(oldUser.getPhoto());
        newUser.setEmail(oldUser.getEmail());
        newUser.setProfile(oldUser.getProfile());
        return this.updateById(newUser);
    }

    @Override
    public boolean updateUserProfile(int id, String profile){
        User newUser = new User();
        User oldUser = this.getById(id);
        newUser.setId(oldUser.getId());
        newUser.setName(oldUser.getName());
        newUser.setPassword(oldUser.getPassword());
        newUser.setPhoto(oldUser.getPhoto());
        newUser.setEmail(oldUser.getEmail());
        newUser.setProfile(profile);
        return this.updateById(newUser);
    }

    @Override
    public boolean updateUserPhoto(int id, MultipartFile file) throws Exception {
        User newUser = new User();
        User oldUser = this.getById(id);
        newUser.setId(oldUser.getId());
        newUser.setName(oldUser.getName());
        newUser.setPassword(oldUser.getPassword());
        newUser.setEmail(oldUser.getEmail());
        newUser.setProfile(oldUser.getProfile());

        // 删除用户原本头像文件（若有的话）
        User user = this.getUserById(id);
        String path = user.getPhoto();
        if(path != null){
            String previousFileName = path.substring(path.lastIndexOf("/"));
            if(minioService.fileExists("userphoto", previousFileName))
                minioService.deleteFile("userphoto",previousFileName);
        }
        // 上传新头像，并修改user的photo属性
        String photoPath = uploadService.userPhotoUpload(file);
        newUser.setPhoto(photoPath);

        return this.updateById(newUser);
    }

    // 删除用户，这里需要将用户的所有相关信息删除，包括笔记、笔记本信息等
    @Override
    public boolean deleteUser(int id){
        noteDao.DeleteAllNoteByUserId(id);
        notebookDao.DeleteAllNotebookByUserId(id);
        logDao.DeleteAllLogByUserId(id);
        photoDao.DeleteAllPhotoByUserId(id);

        return this.removeById(id);
    }
}
