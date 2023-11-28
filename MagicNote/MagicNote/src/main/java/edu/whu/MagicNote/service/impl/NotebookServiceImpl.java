package edu.whu.MagicNote.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import edu.whu.MagicNote.dao.LogDao;
import edu.whu.MagicNote.dao.NoteDao;
import edu.whu.MagicNote.dao.NotebookDao;
import edu.whu.MagicNote.domain.Log;
import edu.whu.MagicNote.domain.Note;
import edu.whu.MagicNote.domain.Notebook;
import edu.whu.MagicNote.exception.TodoException;
import edu.whu.MagicNote.service.INotebookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

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

    @Autowired
    LogDao logDao;

    @Override
    public Notebook addNotebook(Notebook myNotebook) throws TodoException {
        List<Notebook> notebooks= this.getALLNotebooksByName(myNotebook.getName());
        if(notebooks !=null){
            for(Notebook notebook:notebooks) {
                if (Objects.equals(notebook.getUserid(), myNotebook.getUserid()))
                    throw new TodoException(TodoException.INPUT_ERROR, "笔记本名称已存在");
            }
        }
        nb.insert(myNotebook);
        return myNotebook;
    }

    @Override
    public boolean removeNotebook(int id) {
        List<Note> notes = noteDao.FindAllNoteByNotebookId(id);
        for(Note note : notes){
            Log myLog = new Log();
            myLog.setUserid(note.getUserid());
            myLog.setNotename(note.getName());
            myLog.setTimestamp(LocalDateTime.now());
            myLog.setOperation("delete");
            logDao.insert(myLog);
            noteDao.deleteById(note.getId());
        }
        return this.removeById(id);
    }

    @Override
    public boolean removeNotebook(int userid, String name) {
        int id = nb.GetNoteBookId(userid, name);
        List<Note> notes = noteDao.FindAllNoteByNotebookId(id);
        for(Note note : notes){
            Log myLog = new Log();
            myLog.setUserid(note.getUserid());
            myLog.setNotename(note.getName());
            myLog.setTimestamp(LocalDateTime.now());
            myLog.setOperation("delete");
            logDao.insert(myLog);
            noteDao.deleteById(note.getId());
        }
        return this.removeNotebook(id);
    }

    @Override
    public boolean updateNotebook(Notebook myNotebook) throws TodoException {
        List<Notebook> notebooks= this.getALLNotebooksByName(myNotebook.getName());
        if(notebooks !=null){
            for(Notebook notebook:notebooks) {
                if (Objects.equals(notebook.getUserid(), myNotebook.getUserid()))
                    throw new TodoException(TodoException.INPUT_ERROR, "笔记本名称已存在");
            }
        }
        return this.updateById(myNotebook);
    }

    @Override
    public Notebook getNotebook(int id) {
        return this.getById(id);
    }

    @Override
    public List<Notebook> getALLNotebooksByName(String name) {
        return nb.FindAllNoteBooksByName(name);
    }

    @Override
    public List<Notebook> getAllNotebooksByUserId(int id) {
        return nb.FindAllNoteBooksByUserId(id);
    }

    @Override
    public Notebook getNotebookByUserIdAndName(int userid, String name) {
        return nb.FindAllNoteBooksByUserIdAndName(userid,name);
    }
}
