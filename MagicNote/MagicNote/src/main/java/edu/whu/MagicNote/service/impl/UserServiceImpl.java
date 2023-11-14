package edu.whu.MagicNote.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import edu.whu.MagicNote.domain.User;
import edu.whu.MagicNote.dao.UserDao;
import edu.whu.MagicNote.service.IUserService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.stereotype.Service;

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

    public User getUserById(int id){
        return this.getById(id);
    }

    public User getUserByName(String name){
        LambdaQueryWrapper<User> lqw = new LambdaQueryWrapper<>();
        lqw.eq(User::getName, name);
        User user = this.baseMapper.selectOne(lqw);
        return user;
    }

    public User addUser(User user){
        this.baseMapper.insert(user);
        return user;
    }

    public boolean updateUser(User user){
        return this.updateById(user);
    }

    public boolean deleteUser(int id){
        return this.removeById(id);
    }
}
