package edu.whu.MagicNote.dao;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;

import edu.whu.MagicNote.domain.Log;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * <p>
 *  Mapper 接口
 * </p>
 *
 * @author Jerome
 * @since 2023-11-15
 */

@Mapper
public interface LogDao extends BaseMapper<Log> {
    @Select("SELECT log.* FROM log WHERE log.userid = #{userid}")
    List<Log> FindAllLogByUserId(int userid);

    @Delete("DELETE FROM log WHERE log.userid = #{userid}")
    void DeleteAllLogByUserId(int userid);
}
