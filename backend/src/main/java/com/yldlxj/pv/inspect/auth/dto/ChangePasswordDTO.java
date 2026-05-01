package com.yldlxj.pv.inspect.auth.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

@Data
public class ChangePasswordDto {

    @NotBlank(message = "原密码不能为空")
    private String oldPassword;

    @NotBlank(message = "新密码不能为空")
    @Size(min = 8, message = "新密码长度不能少于8位")
    @Pattern(regexp = "^[a-zA-Z0-9!@#$%^&*()_+\\-=\\[\\]{};':\",./<>?`~]*$", message = "密码只能包含字母、数字和常见符号")
    private String newPassword;
}
