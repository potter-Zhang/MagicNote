package edu.whu.MagicNote.service;

import edu.whu.MagicNote.domain.Note;
import com.baomidou.mybatisplus.extension.service.IService;
import edu.whu.MagicNote.exception.TodoException;
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
    public Note addNote(Note myNote) throws TodoException;
    //根据id删除笔记
    public boolean removeNote(int id);
    //根据name删除笔记
    public boolean removeNote(String name);
    //修改笔记
    public boolean updateNote(Note myNote);
    //根据id查询笔记
    public Note getNote(int id);
    //根据用户名，笔记本名，笔记名查询笔记
    public Note getNote(int userid,int notebookid,String name);
    //根据name和用户id查询笔记
    public List<Note> getAllNotesByUserIdAndName(int userid,String name);
    //根据用户id查询所有笔记
    public List<Note> getAllNoteByUserId(int id);
    //根据笔记本id查询所有笔记
    public List<Note> getAllNoteByNotebookId(int id);

    // 根据搜素关键词搜索笔记
    public List<Note> searchNotesByWords(int userid, String words);
}
