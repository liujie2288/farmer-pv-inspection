package com.yldlxj.pv.inspect.auth;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sys_user_token")
public class SysUserToken {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String tokenHash;

    private String deviceInfo;

    private LocalDateTime expiresAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
