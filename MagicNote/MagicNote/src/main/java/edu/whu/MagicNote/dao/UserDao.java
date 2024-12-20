package edu.whu.MagicNote.dao;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import edu.whu.MagicNote.domain.User;
import org.apache.ibatis.annotations.Mapper;

/**
 * <p>
 *  Mapper 接口
 * </p>
 *
 * @author susong
 * @since 2023-11-14
 */

@Mapper
public interface UserDao extends BaseMapper<User> {
}
