package edu.whu.MagicNote.dao;

import edu.whu.MagicNote.domain.Note;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
<<<<<<< HEAD
import org.apache.ibatis.annotations.Mapper;
=======
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import org.springframework.stereotype.Service;

import java.util.List;
>>>>>>> 9ded10f118139632a28023c2d1d710277346f0f2

/**
 * <p>
 *  Mapper 接口
 * </p>
 *
 * @author susong
 * @since 2023-11-14
 */
<<<<<<< HEAD

=======
>>>>>>> 9ded10f118139632a28023c2d1d710277346f0f2
@Mapper
public interface NoteDao extends BaseMapper<Note> {
    //根据文件名删除笔记
    @Delete("DELETE FROM note WHERE note.name = #{name}")
    void DeleteNoteByName(String name);
    //根据文件名查询笔记
    @Select("SELECT FROM user WHERE user.name = #{name}")
    Note FindNoteByName(String name);
    //根据用户id查询所有笔记
    @Select("SELECT FROM note WHERE note.user_id = #{user_id}")
    List<Note> FindAllNoteByUserId(int id);
}
