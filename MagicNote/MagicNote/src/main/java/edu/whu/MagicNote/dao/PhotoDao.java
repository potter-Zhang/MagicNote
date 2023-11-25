package edu.whu.MagicNote.dao;

import edu.whu.MagicNote.domain.Photo;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

/**
 * <p>
 *  Mapper 接口
 * </p>
 *
 * @author Jerome
 * @since 2023-11-25
 */

@Mapper
public interface PhotoDao extends BaseMapper<Photo> {

}
