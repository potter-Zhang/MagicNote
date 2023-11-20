package edu.whu.MagicNote.service.impl;

import edu.whu.MagicNote.domain.Notebook;
import edu.whu.MagicNote.dao.NotebookDao;
import edu.whu.MagicNote.service.INotebookService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.stereotype.Service;

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

}
