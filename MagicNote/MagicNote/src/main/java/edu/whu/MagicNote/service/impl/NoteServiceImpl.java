package edu.whu.MagicNote.service.impl;

import edu.whu.MagicNote.domain.Note;
import edu.whu.MagicNote.dao.NoteDao;
import edu.whu.MagicNote.service.INoteService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * <p>
 *  服务实现类
 * </p>
 *
 * @author susong
 * @since 2023-11-14
 */
@Service
public class NoteServiceImpl extends ServiceImpl<NoteDao, Note> implements INoteService {
    @Autowired
    NoteDao myNoteDao;
    //添加笔记
    @Override
    public Note addNote(Note myNote) {
        myNoteDao.insert(myNote);
        return myNote;
    }
    //根据id删除笔记
    @Override
    public void removeNote(int id) {
        myNoteDao.deleteById(id);
    }
    //根据文件名删除笔记
    @Override
    public void removeNote(String name) {
        myNoteDao.DeleteNoteByName(name);
    }
    //更新笔记
    @Override
    public void updateNote(Note myNote) {
        myNoteDao.updateById(myNote);
    }
    //根据id查询笔记
    @Override
    public Note getNote(int id) {
        return myNoteDao.selectById(id);
    }
    //根据文件名查询笔记
    @Override
    public Note getNote(String name) {
        return myNoteDao.FindNoteByName(name);
    }

    @Override
    public List<Note> getAllNoteByUserId(int id) {
        return myNoteDao.FindAllNoteByUserId(id);
    }
}
