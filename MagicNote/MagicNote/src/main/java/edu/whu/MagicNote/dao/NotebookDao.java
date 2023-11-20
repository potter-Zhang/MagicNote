package edu.whu.MagicNote.dao;

import edu.whu.MagicNote.domain.Notebook;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

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

}
