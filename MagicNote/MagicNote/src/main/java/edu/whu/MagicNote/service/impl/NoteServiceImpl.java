package edu.whu.MagicNote.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import edu.whu.MagicNote.dao.NoteDao;
import edu.whu.MagicNote.domain.Note;
import edu.whu.MagicNote.exception.TodoException;
import edu.whu.MagicNote.service.INoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

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
    public Note addNote(Note myNote) throws TodoException {
        List<Note> notes=this.getAllNotesByUserIdAndName(myNote.getUserid(),myNote.getName());
        if(notes!=null){
            for(Note note:notes){
                if(Objects.equals(note.getNotebookid(), myNote.getNotebookid())){
                    throw new TodoException(TodoException.INPUT_ERROR,"该笔记名在当前笔记本中已存在");
                }
            }
        }
        myNoteDao.insert(myNote);
        return myNote;
    }
    //根据id删除笔记
    @Override
    public boolean removeNote(int id) {
       return this.removeById(id);
    }

    //根据文件名删除笔记
    @Override
    public boolean removeNote(String name) {
        LambdaQueryWrapper<Note> lqw = new LambdaQueryWrapper<>();
        lqw.eq(Note::getName, name);
        return this.remove(lqw);
    }
    //更新笔记
    @Override
    public boolean updateNote(Note myNote) throws TodoException {
        List<Note> notes=this.getAllNotesByUserIdAndName(myNote.getUserid(),myNote.getName());
        if(notes!=null){
            for(Note note:notes){
                if(Objects.equals(note.getNotebookid(), myNote.getNotebookid())){
                    throw new TodoException(TodoException.INPUT_ERROR,"该笔记名在当前笔记本中已存在");
                }
            }
        }
        return this.updateById(myNote);
    }
    //根据id查询笔记
    @Override
    public Note getNote(int id) {
        return myNoteDao.selectById(id);
    }

    @Override
    public Note getNote(int userid, int notebookid, String name) {
        LambdaQueryWrapper<Note> lqw = new LambdaQueryWrapper<>();
        lqw.eq(Note::getUserid, userid);
        lqw.eq(Note::getNotebookid,notebookid);
        lqw.eq(Note::getName,name);
        return this.getOne(lqw);
    }

    @Override
    public List<Note> getAllNotesByUserIdAndName(int userid, String name) {
        return myNoteDao.FindAllNoteByUserIdAndName(userid,name);
    }


    @Override
    public List<Note> getAllNoteByUserId(int id) {
        return myNoteDao.FindAllNoteByUserId(id);
    }

    @Override
    public List<Note> getAllNoteByNotebookId(int id) {
        return myNoteDao.FindAllNoteByNotebookId(id);
    }

    // 根据搜素关键词搜索笔记
    @Override
    public List<Note> searchNotesByWords(int userid, String words){
        words = words + "*";
        List<Note> result = new ArrayList<>();
        // 这里返回的结果中，先返回笔记名称中有关键词，之后是笔记文本内容中有关键词的，最后是笔记中图片总文本中有关键词的
        result.addAll(myNoteDao.SearchNoteNameByKeywords(userid, words));
        result.addAll(myNoteDao.SearchNoteContentByKeywords(userid, words));
        result.addAll(myNoteDao.SearchNotePhotoByKeywords(userid, words));

        return result;
    }
}
