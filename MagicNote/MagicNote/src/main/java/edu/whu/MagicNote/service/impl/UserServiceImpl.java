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
    public User addUser(User user){
        this.baseMapper.insert(user);
        return user;
    }

    @Override
    public boolean updateUser(User user){
        return this.updateById(user);
    }

    @Override
    public boolean deleteUser(int id){
        return this.removeById(id);
    }
}
