package edu.whu.MagicNote.service.impl;

import edu.whu.MagicNote.domain.Log;
import edu.whu.MagicNote.dao.LogDao;
import edu.whu.MagicNote.service.ILogService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.stereotype.Service;

/**
 * <p>
 *  服务实现类
 * </p>
 *
 * @author Jerome
 * @since 2023-11-15
 */
@Service
public class LogServiceImpl extends ServiceImpl<LogDao, Log> implements ILogService {

}
