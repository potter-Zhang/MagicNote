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

    // 根据用户id查询所有笔记
    @Select("SELECT note.* FROM note WHERE note.userid = #{userid}")
    List<Note> FindAllNoteByUserId(int userid);

    // 根据笔记本id查询所有笔记
    @Select("SELECT note.* FROM note WHERE note.notebookid = #{notebookid}")
    List<Note> FindAllNoteByNotebookId(int notebookid);

    // 根据搜索关键词搜索含有关键词的笔记（查找笔记名称或者笔记内容中含有关键词的笔记）
    @Select("SELECT note.* FROM note WHERE note.userid = #{userid} AND (MATCH(name) AGAINST(#{words} IN BOOLEAN MODE) OR MATCH(content) AGAINST(#{words} IN BOOLEAN MODE))")
    List<Note> SearchNotesByKeywords(int userid, String words);

}
