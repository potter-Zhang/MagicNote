package edu.whu.MagicNote.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import java.io.Serializable;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * <p>
 * 
 * </p>
 *
 * @author Jerome
 * @since 2023-11-25
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class Photo implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Integer id;

    private Integer noteid;

    private String content;

    private String path;

    private Integer userid;


}
