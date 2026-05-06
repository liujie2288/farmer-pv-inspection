package com.yldlxj.pv.inspect.user.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class ToggleStatusDto {
    @NotNull(message = "状态不能为空")
    private Integer status;
}
