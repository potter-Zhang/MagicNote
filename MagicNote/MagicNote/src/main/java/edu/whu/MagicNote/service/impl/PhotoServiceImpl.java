package edu.whu.MagicNote.service.impl;

import edu.whu.MagicNote.domain.Photo;
import edu.whu.MagicNote.dao.PhotoDao;
import edu.whu.MagicNote.service.IPhotoService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.stereotype.Service;

/**
 * <p>
 *  服务实现类
 * </p>
 *
 * @author Jerome
 * @since 2023-11-25
 */
@Service
public class PhotoServiceImpl extends ServiceImpl<PhotoDao, Photo> implements IPhotoService {

    @Override
    public Photo addPhoto(Photo photo){
        this.save(photo);
        return photo;
    }
}
