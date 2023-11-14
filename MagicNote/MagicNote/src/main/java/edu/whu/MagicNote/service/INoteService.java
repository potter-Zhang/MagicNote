package edu.whu.MagicNote.service;

import edu.whu.MagicNote.domain.Note;
import com.baomidou.mybatisplus.extension.service.IService;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * <p>
 *  服务类
 * </p>
 *
 * @author susong
 * @since 2023-11-14
 */
@Service
public interface INoteService extends IService<Note> {
    //添加笔记
    public Note addNote(Note myNote);
    //根据id删除笔记
    public boolean removeNote(int id);
    //根据name删除笔记
    public boolean removeNote(String fileP);
    //修改笔记
    public boolean updateNote(Note myNote);
    //根据id查询笔记
    public Note getNote(int id);
    //根据name查询笔记
    public Note getNote(String name);
    //根据用户id查询所有笔记
    public List<Note> getAllNoteByUserId(int id);
}
