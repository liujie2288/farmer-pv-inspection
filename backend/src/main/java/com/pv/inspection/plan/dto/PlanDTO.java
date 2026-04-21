package com.pv.inspection.plan.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Data
public class PlanDTO {

    @NotBlank(message = "计划名称不能为空")
    private String planName;

    @NotNull(message = "项目ID不能为空")
    private Long projectId;

    @NotNull(message = "开始时间不能为空")
    private LocalDateTime startTime;

    @NotNull(message = "结束时间不能为空")
    private LocalDateTime endTime;
}
