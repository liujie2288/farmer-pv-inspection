package com.yldlxj.pv.inspect.user.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

@Data
public class UserCreateDto {

    @NotBlank(message = "用户名不能为空")
    @Size(min = 2, max = 30, message = "用户名长度2-30字符")
    @Pattern(regexp = "^[a-z0-9_]+$", message = "用户名只能包含小写字母、数字和下划线")
    private String username;

    @Size(min = 6, max = 50, message = "密码长度6-50字符")
    private String password;

    @NotBlank(message = "真实姓名不能为空")
    @Size(max = 20, message = "真实姓名最长20字符")
    private String realName;

    @Size(max = 20, message = "电话最长20字符")
    @Pattern(regexp = "^[\\d\\s\\-()+]*$", message = "电话格式不正确")
    private String phone;

    @NotBlank(message = "角色不能为空")
    private String role;
}
