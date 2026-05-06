package com.yldlxj.pv.inspect.record.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class RejectRecordDto {
    @NotBlank(message = "驳回原因不能为空")
    @Size(max = 300, message = "驳回原因不能超过300字")
    private String reason;
}
