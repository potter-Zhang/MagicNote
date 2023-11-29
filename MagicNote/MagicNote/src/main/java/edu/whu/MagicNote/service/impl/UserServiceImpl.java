package edu.whu.MagicNote.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import edu.whu.MagicNote.dao.*;
import edu.whu.MagicNote.domain.User;
import edu.whu.MagicNote.service.IUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.sql.rowset.serial.SerialBlob;
import java.io.IOException;
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
    public boolean updateUserPhoto(int id, MultipartFile photo) throws IOException, SQLException {
        User newUser = new User();
        User oldUser = this.getById(id);
        newUser.setId(oldUser.getId());
        newUser.setName(oldUser.getName());
        newUser.setPassword(oldUser.getPassword());
        newUser.setEmail(oldUser.getEmail());
        newUser.setProfile(oldUser.getProfile());
        byte[] fileBytes = photo.getBytes();
        Blob blob = new SerialBlob(fileBytes);
        newUser.setPhoto(blob);
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
