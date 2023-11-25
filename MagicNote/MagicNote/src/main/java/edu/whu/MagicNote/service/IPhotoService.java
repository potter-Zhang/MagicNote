package edu.whu.MagicNote.service;

import edu.whu.MagicNote.domain.Photo;
import com.baomidou.mybatisplus.extension.service.IService;
import org.springframework.stereotype.Service;

/**
 * <p>
 *  服务类
 * </p>
 *
 * @author Jerome
 * @since 2023-11-25
 */

@Service
public interface IPhotoService extends IService<Photo> {

    public Photo addPhoto(Photo photo);

}
