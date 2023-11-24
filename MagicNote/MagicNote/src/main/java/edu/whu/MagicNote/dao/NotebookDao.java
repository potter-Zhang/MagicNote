package edu.whu.MagicNote.dao;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import edu.whu.MagicNote.domain.Notebook;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * <p>
 *  Mapper 接口
 * </p>
 *
 * @author Jerome
 * @since 2023-11-20
 */

@Mapper
public interface NotebookDao extends BaseMapper<Notebook> {
    //根据用户id查询所有notebook
    @Select("SELECT notebook.* FROM notebook WHERE notebook.userid = #{userid}")
    List<Notebook> FindAllNoteBooksByUserId(int userid);

    @Select("SELECT notebook.id FROM notebook WHERE notebook.userid = #{userid}) AND notebook.name = #{name}")
    int GetNoteBookId(int userid, String name);
}
