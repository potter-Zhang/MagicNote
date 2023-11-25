package edu.whu.MagicNote.dao;

import edu.whu.MagicNote.domain.Note;
import edu.whu.MagicNote.domain.Photo;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
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
 * @since 2023-11-25
 */

@Mapper
public interface PhotoDao extends BaseMapper<Photo> {

    // 根据用户id查询所有相关图片
    @Select("SELECT photo.* FROM photo WHERE photo.userid = #{userid}")
    List<Photo> FindAllPhotoByUserId(int userid);

    @Delete("DELETE FROM photo WHERE photo.userid = #{userid}")
    void DeleteAllPhotoByUserId(int userid);
}
