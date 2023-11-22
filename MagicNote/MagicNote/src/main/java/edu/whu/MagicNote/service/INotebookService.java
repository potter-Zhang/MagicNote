package edu.whu.MagicNote.service;

import com.baomidou.mybatisplus.extension.service.IService;
import edu.whu.MagicNote.domain.Notebook;

import java.util.List;

/**
 * <p>
 *  服务类
 * </p>
 *
 * @author Jerome
 * @since 2023-11-20
 */

public interface INotebookService extends IService<Notebook> {
    //添加笔记本
    public Notebook addNotebook(Notebook myNotebook);
    //根据id删除笔记本
    public boolean removeNotebook(int id);
    //根据name删除笔记本
    public boolean removeNotebook(String name);
    //修改笔记本
    public boolean updateNotebook(Notebook myNotebook);
    //根据id查询笔记本
    public Notebook getNotebook(int id);
    //根据name查询笔记本
    public Notebook getNotebook(String name);
    //根据用户id查询所有笔记本
    public List<Notebook> getAllNotebooksByUserId(int id);
}
