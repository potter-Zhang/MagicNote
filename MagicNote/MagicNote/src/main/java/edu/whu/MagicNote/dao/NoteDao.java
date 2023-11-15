package edu.whu.MagicNote.dao;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import edu.whu.MagicNote.domain.Note;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;


/**
 * <p>
 *  Mapper 接口
 * </p>
 *
 * @author susong
 * @since 2023-11-14
 */

@Mapper
public interface NoteDao extends BaseMapper<Note> {
    //根据用户id查询所有笔记
    @Select("SELECT FROM note WHERE note.userid = #{userid}")
    List<Note> FindAllNoteByUserId(int id);
}
