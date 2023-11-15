package edu.whu.MagicNote.service;

import com.baomidou.mybatisplus.extension.service.IService;
import edu.whu.MagicNote.domain.Log;

import java.util.List;

/**
 * <p>
 *  服务类
 * </p>
 *
 * @author Jerome
 * @since 2023-11-15
 */
public interface ILogService extends IService<Log> {
    //添加log
    public Log addLog(Log myLog);
    //根据id删除log
    public boolean removeLog(int id);
    //根据id查询log
    public Log getLog(int id);
    //根据用户id查询所有log
    public List<Log> getAllLogByUserId(int id);
}
