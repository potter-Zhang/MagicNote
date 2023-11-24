package edu.whu.MagicNote.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import edu.whu.MagicNote.dao.NoteDao;
import edu.whu.MagicNote.dao.NotebookDao;
import edu.whu.MagicNote.domain.Note;
import edu.whu.MagicNote.domain.Notebook;
import edu.whu.MagicNote.service.INotebookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * <p>
 *  服务实现类
 * </p>
 *
 * @author Jerome
 * @since 2023-11-20
 */
@Service
public class NotebookServiceImpl extends ServiceImpl<NotebookDao, Notebook> implements INotebookService {
    @Autowired
    NotebookDao nb;

    @Autowired
    NoteDao noteDao;

    @Override
    public Notebook addNotebook(Notebook myNotebook) {
        nb.insert(myNotebook);
        return myNotebook;
    }

    @Override
    public boolean removeNotebook(int id) {
        LambdaQueryWrapper<Note> lqw = new LambdaQueryWrapper<>();
        lqw.eq(Note::getNotebookid,id);
        noteDao.delete(lqw);
        return this.removeById(id);
    }

    @Override
    public boolean removeNotebook(int userid, String name) {
        int id = nb.GetNoteBookId(userid, name);
        LambdaQueryWrapper<Note> lqw = new LambdaQueryWrapper<>();
        lqw.eq(Note::getNotebookid,id);
        noteDao.delete(lqw);
        return this.removeNotebook(id);
    }

    @Override
    public boolean updateNotebook(Notebook myNotebook) {
        return this.updateById(myNotebook);
    }

    @Override
    public Notebook getNotebook(int id) {
        return this.getById(id);
    }

    @Override
    public Notebook getNotebook(String name) {
        LambdaQueryWrapper<Notebook> lqw = new LambdaQueryWrapper<>();
        lqw.eq(Notebook::getName,name);
        return this.getOne(lqw);
    }

    @Override
    public List<Notebook> getAllNotebooksByUserId(int id) {
        return nb.FindAllNoteBooksByUserId(id);
    }
}
