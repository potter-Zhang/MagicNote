package edu.whu.MagicNote.dao;

import edu.whu.MagicNote.domain.Note;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
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
public interface NoteDao extends BaseMapper<Note> {

}
