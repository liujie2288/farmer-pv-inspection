package com.yldlxj.pv.inspect.auth.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class ResetPasswordDto {

    @NotNull(message = "用户ID不能为空")
    private Long userId;
}
