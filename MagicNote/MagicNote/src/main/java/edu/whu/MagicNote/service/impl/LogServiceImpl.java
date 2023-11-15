package edu.whu.MagicNote.service.impl;

import edu.whu.MagicNote.domain.Log;
import edu.whu.MagicNote.dao.LogDao;
import edu.whu.MagicNote.service.ILogService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

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
    @Autowired
    LogDao logDao;
    @Override
    public Log addLog(Log myLog) {
        logDao.insert(myLog);
        return myLog;
    }

    @Override
    public boolean removeLog(int id) {
        return this.removeById(id);
    }

    @Override
    public Log getLog(int id) {
        return logDao.selectById(id);
    }

    @Override
    public List<Log> getAllLogByUserId(int id) {
        return logDao.FindAllLogByUserId(id);
    }
}
