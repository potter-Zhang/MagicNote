package edu.whu.MagicNote.service.impl;

import edu.whu.MagicNote.domain.Note;
import edu.whu.MagicNote.dao.NoteDao;
import edu.whu.MagicNote.service.INoteService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.stereotype.Service;

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

}
