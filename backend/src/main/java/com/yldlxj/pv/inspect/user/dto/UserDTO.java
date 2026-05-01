package com.yldlxj.pv.inspect.user.dto;

import lombok.Data;

@Data
public class UserDto {
    private Long id;

    private String username;

    private String realName;

    private String phone;

    private String role;

    private Integer status;

    private Boolean needResetPwd;
}
