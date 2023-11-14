package edu.whu.MagicNote.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import java.time.LocalDateTime;
import java.io.Serializable;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * <p>
 * 
 * </p>
 *
 * @author susong
 * @since 2023-11-14
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class Note implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Integer id;

    private String name;

    private Integer user_id;

    private String content;

    private String directory;

    private LocalDateTime createTime;


}
