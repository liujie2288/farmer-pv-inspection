package com.pv.inspection.auth.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class ResetPasswordDTO {

    @NotNull(message = "用户ID不能为空")
    private Long userId;
}
