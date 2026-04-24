package com.yldlxj.pv.inspect.user.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

@Data
public class UserUpdateDto {

    @NotBlank(message = "真实姓名不能为空")
    @Size(max = 20, message = "真实姓名最长20字符")
    private String realName;

    @Size(max = 20, message = "电话最长20字符")
    @Pattern(regexp = "^[\\d\\s\\-()+]*$", message = "电话格式不正确")
    private String phone;

    @NotBlank(message = "角色不能为空")
    private String role;

    @NotNull(message = "状态不能为空")
    private Integer status;
}
