package com.pv.inspection.user.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class UserDTO {

    @NotBlank(message = "用户名不能为空")
    @Size(max = 50, message = "用户名最长50字符")
    private String username;

    @Size(min = 6, max = 100, message = "密码长度6-100字符")
    private String password;

    @NotBlank(message = "真实姓名不能为空")
    @Size(max = 50, message = "真实姓名最长50字符")
    private String realName;

    @Size(max = 20, message = "电话最长20字符")
    private String phone;

    @NotBlank(message = "角色不能为空")
    private String role;
}
