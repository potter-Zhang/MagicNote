package edu.whu.MagicNote.service.impl;

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

}
