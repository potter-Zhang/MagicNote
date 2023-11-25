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

    // 根据搜索关键词搜索含有关键词的笔记（查找笔记名称或者笔记内容（包括笔记内容中的图片中的文字）中含有关键词的笔记）
    // 这里分三个方法，分别为查找出笔记name中含有关键词、笔记content中含有关键词、笔记内容中的图片中含有关键词的结果，三者搜索结果显示优先级依次递减
    @Select("SELECT note.* FROM note WHERE note.userid = #{userid} AND MATCH(name) AGAINST(#{words} IN BOOLEAN MODE)")
    List<Note> SearchNoteNameByKeywords(int userid, String words);

    @Select("SELECT note.* FROM note WHERE note.userid = #{userid} AND MATCH(content) AGAINST(#{words} IN BOOLEAN MODE)")
    List<Note> SearchNoteContentByKeywords(int userid, String words);

    @Select("SELECT DISTINCT note.* FROM note,photo WHERE MATCH(photo.content) AGAINST (#{words} IN BOOLEAN MODE) AND note.userid = #{userid} AND note.id = photo.noteid")
    List<Note> SearchNotePhotoByKeywords(int userid, String words);

}
