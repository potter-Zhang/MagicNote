package edu.whu.MagicNote.service;

import com.baomidou.mybatisplus.extension.service.IService;
import edu.whu.MagicNote.domain.User;
import org.springframework.stereotype.Service;

/**
 * <p>
 *  服务类
 * </p>
 *
 * @author susong
 * @since 2023-11-14
 */
@Service
public interface IUserService extends IService<User> {
    public User getUserById(int id);

    public User getUserByName(String name);

    public User getUserByEmail(String Email);

    public User addUser(User user);

    public boolean updateUser(User user);

    public boolean deleteUser(int id);
}
